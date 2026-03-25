from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import pandas as pd
import io
import logging

from app.core.database import get_db
from app.core.deps import require_role, log_audit
from app.core.encryption import encrypt_patient_record, decrypt_patient_record
from app.models.models import User, Patient, PatientUploadBatch
from app.schemas.schemas import PatientOut, PatientUpdate, PatientListResponse, UploadBatchOut, PatientCreate
from app.core.config import settings

router = APIRouter(prefix="/patients", tags=["Patients"])
logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"Patient ID", "First Name", "Last Name", "Date of Birth", "Gender"}
GENDER_OPTIONS = {"Male", "Female", "Other", "Prefer not to say"}


def decrypt_patient_to_out(patient: Patient) -> PatientOut:
    """Decrypt a Patient ORM object into PatientOut schema."""
    raw = {
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
    }
    decrypted = decrypt_patient_record(raw)
    return PatientOut(
        id=patient.id,
        patient_id=patient.patient_id,
        first_name=decrypted["first_name"],
        last_name=decrypted["last_name"],
        date_of_birth=decrypted["date_of_birth"],
        gender=decrypted["gender"],
        upload_batch_id=patient.upload_batch_id,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
    )


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadBatchOut, status_code=status.HTTP_201_CREATED)
async def upload_patients(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"

    # File type validation
    filename = file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in settings.ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only .xlsx and .xls files are allowed")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Create batch record
    batch = PatientUploadBatch(
        uploaded_by=current_user.id,
        filename=filename,
        status="processing",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        batch.status = "failed"
        batch.error_details = f"Cannot parse Excel file: {str(e)}"
        db.commit()
        raise HTTPException(status_code=400, detail=f"Cannot parse Excel file: {str(e)}")

    # Column validation
    missing_cols = REQUIRED_COLUMNS - set(df.columns)
    if missing_cols:
        batch.status = "failed"
        batch.error_details = f"Missing columns: {', '.join(missing_cols)}"
        db.commit()
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

    if len(df) > settings.MAX_RECORDS_PER_UPLOAD:
        raise HTTPException(status_code=400, detail=f"Max {settings.MAX_RECORDS_PER_UPLOAD} records per upload")

    batch.total_records = len(df)
    successful = 0
    errors = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel row number (1-indexed + header)
        try:
            patient_id = str(row.get("Patient ID", "")).strip()
            first_name = str(row.get("First Name", "")).strip()
            last_name = str(row.get("Last Name", "")).strip()
            dob_raw = row.get("Date of Birth")
            gender = str(row.get("Gender", "")).strip()

            # Validate required fields
            if not patient_id:
                errors.append(f"Row {row_num}: Patient ID is required")
                continue
            if not first_name:
                errors.append(f"Row {row_num}: First Name is required")
                continue
            if not last_name:
                errors.append(f"Row {row_num}: Last Name is required")
                continue
            if gender not in GENDER_OPTIONS:
                errors.append(f"Row {row_num}: Invalid gender '{gender}'")
                continue

            # Parse date
            if pd.isna(dob_raw):
                errors.append(f"Row {row_num}: Date of Birth is required")
                continue
            try:
                if hasattr(dob_raw, 'strftime'):
                    dob_str = dob_raw.strftime("%Y-%m-%d")
                else:
                    from datetime import datetime as dt
                    dob_str = pd.to_datetime(str(dob_raw)).strftime("%Y-%m-%d")
            except Exception:
                errors.append(f"Row {row_num}: Invalid date format for Date of Birth")
                continue

            # Encrypt PHI fields before storing
            record = {
                "first_name": first_name,
                "last_name": last_name,
                "date_of_birth": dob_str,
                "gender": gender,
            }
            encrypted = encrypt_patient_record(record)

            patient = Patient(
                patient_id=patient_id,
                first_name=encrypted["first_name"],
                last_name=encrypted["last_name"],
                date_of_birth=encrypted["date_of_birth"],
                gender=encrypted["gender"],
                upload_batch_id=batch.id,
                uploaded_by=current_user.id,
            )
            db.add(patient)
            successful += 1

        except Exception as e:
            errors.append(f"Row {row_num}: Unexpected error — {str(e)}")
            continue

    batch.successful_records = successful
    batch.failed_records = len(errors)
    batch.status = "completed" if successful > 0 else "failed"
    batch.completed_at = datetime.utcnow()
    if errors:
        batch.error_details = "\n".join(errors[:50])  # Store up to 50 errors

    db.commit()
    db.refresh(batch)

    log_audit(
        db, current_user.id, "UPLOAD_PATIENTS",
        resource="patients", resource_id=str(batch.id),
        details=f"Uploaded {successful}/{len(df)} records from {filename}",
        ip_address=ip,
    )
    return batch


# ── List / Search ─────────────────────────────────────────────────────────────

@router.get("/", response_model=PatientListResponse)
async def list_patients(
    search: Optional[str] = Query(None, description="Search by patient_id"),
    batch_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    query = db.query(Patient).filter(
        Patient.uploaded_by == current_user.id,
        Patient.is_active == True,
    )

    if batch_id:
        query = query.filter(Patient.upload_batch_id == batch_id)

    # Search on unencrypted patient_id only (encrypted fields not searchable without full scan)
    if search:
        query = query.filter(Patient.patient_id.ilike(f"%{search}%"))

    total = query.count()

    # Sorting
    allowed_sort = {"created_at", "updated_at", "patient_id"}
    if sort_by not in allowed_sort:
        sort_by = "created_at"
    col = getattr(Patient, sort_by)
    if sort_order == "asc":
        query = query.order_by(col.asc())
    else:
        query = query.order_by(col.desc())

    offset = (page - 1) * page_size
    patients = query.offset(offset).limit(page_size).all()

    decrypted_patients = [decrypt_patient_to_out(p) for p in patients]

    log_audit(db, current_user.id, "VIEW_PATIENTS", resource="patients")

    return PatientListResponse(
        items=decrypted_patients,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/batches", response_model=List[UploadBatchOut])
async def list_batches(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    return (
        db.query(PatientUploadBatch)
        .filter(PatientUploadBatch.uploaded_by == current_user.id)
        .order_by(PatientUploadBatch.created_at.desc())
        .all()
    )


@router.get("/{patient_id_param}", response_model=PatientOut)
async def get_patient(
    patient_id_param: int,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id_param,
        Patient.uploaded_by == current_user.id,
        Patient.is_active == True,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    log_audit(db, current_user.id, "VIEW_PATIENT", resource="patients", resource_id=str(patient_id_param))
    return decrypt_patient_to_out(patient)


# ── Inline Edit ───────────────────────────────────────────────────────────────

@router.patch("/{patient_id_param}", response_model=PatientOut)
async def update_patient(
    patient_id_param: int,
    body: PatientUpdate,
    request: Request,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id_param,
        Patient.uploaded_by == current_user.id,
        Patient.is_active == True,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = body.model_dump(exclude_unset=True)
    encrypted_updates = encrypt_patient_record(update_data)

    for key, value in encrypted_updates.items():
        setattr(patient, key, value)
    patient.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(patient)

    ip = request.client.host if request.client else "unknown"
    log_audit(
        db, current_user.id, "UPDATE_PATIENT",
        resource="patients", resource_id=str(patient_id_param),
        ip_address=ip,
    )
    return decrypt_patient_to_out(patient)


@router.delete("/{patient_id_param}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id_param: int,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id_param,
        Patient.uploaded_by == current_user.id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.is_active = False
    db.commit()
    log_audit(db, current_user.id, "DELETE_PATIENT", resource="patients", resource_id=str(patient_id_param))
