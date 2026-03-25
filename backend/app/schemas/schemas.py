from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
import re


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        from app.core.security import validate_password_strength
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v


# ── User Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_id: int
    location_id: int
    team_id: int

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,50}$", v):
            raise ValueError("Username must be 3-50 chars, alphanumeric/underscore only")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        from app.core.security import validate_password_strength
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    location_id: Optional[int] = None
    team_id: Optional[int] = None
    is_active: Optional[bool] = None


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class LocationOut(BaseModel):
    id: int
    code: str
    name: str
    timezone: str

    class Config:
        from_attributes = True


class TeamOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    is_locked: bool
    last_login: Optional[datetime]
    created_at: datetime
    role: RoleOut
    location: LocationOut
    team: TeamOut

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: RoleOut
    location: LocationOut
    team: TeamOut
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Patient Schemas ───────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str

    @field_validator("patient_id")
    @classmethod
    def validate_patient_id(cls, v):
        if not re.match(r"^[a-zA-Z0-9\-_]{1,50}$", v):
            raise ValueError("Patient ID must be alphanumeric (1-50 chars)")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        allowed = ["Male", "Female", "Other", "Prefer not to say"]
        if v not in allowed:
            raise ValueError(f"Gender must be one of: {', '.join(allowed)}")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v):
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Date of birth must be in YYYY-MM-DD format")
        try:
            from datetime import date
            parts = v.split("-")
            date(int(parts[0]), int(parts[1]), int(parts[2]))
        except ValueError:
            raise ValueError("Invalid date of birth")
        return v


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v is None:
            return v
        allowed = ["Male", "Female", "Other", "Prefer not to say"]
        if v not in allowed:
            raise ValueError(f"Gender must be one of: {', '.join(allowed)}")
        return v


class PatientOut(BaseModel):
    id: int
    patient_id: str
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    upload_batch_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    items: List[PatientOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class UploadBatchOut(BaseModel):
    id: int
    filename: str
    total_records: int
    successful_records: int
    failed_records: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Dashboard Schemas ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_patients: Optional[int] = None
    my_patients: Optional[int] = None
    recent_uploads: Optional[int] = None
    locations: dict
    teams: dict
    roles: Optional[dict] = None
