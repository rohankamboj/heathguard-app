"""
Database Models — HealthGuard
All models defined here for clarity. Alembic migrations reference this file.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Text, Enum as SAEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class RoleEnum(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    user = "user"


class LocationEnum(str, enum.Enum):
    US = "US"
    IN = "IN"
    EU = "EU"
    AU = "AU"


class TeamEnum(str, enum.Enum):
    AR = "AR"
    EPA = "EPA"
    PRI = "PRI"


class GenderEnum(str, enum.Enum):
    male = "Male"
    female = "Female"
    other = "Other"
    prefer_not_to_say = "Prefer not to say"


# ── Core Auth Models ──────────────────────────────────────────────────────────

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    resource = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    description = Column(String(255))

    roles = relationship("RolePermission", back_populates="permission")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")

    __table_args__ = (UniqueConstraint("role_id", "permission_id"),)


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    timezone = Column(String(50), default="UTC")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="location")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="team")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=datetime.utcnow)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    location = relationship("Location", back_populates="users")
    team = relationship("Team", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    patient_uploads = relationship("PatientUploadBatch", back_populates="uploaded_by_user")


# ── Patient Data Models ───────────────────────────────────────────────────────

class PatientUploadBatch(Base):
    """Tracks each Excel file upload."""
    __tablename__ = "patient_upload_batches"

    id = Column(Integer, primary_key=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    status = Column(String(50), default="processing")  # processing, completed, failed
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    uploaded_by_user = relationship("User", back_populates="patient_uploads")
    patients = relationship("Patient", back_populates="upload_batch", cascade="all, delete-orphan")


class Patient(Base):
    """
    Stores patient PHI with application-level AES-256-GCM encryption.

    Encryption decisions:
    - patient_id: UNENCRYPTED — serves as pseudonymous index key; contains
      no direct PHI (alphanumeric ID, not name/DOB). Enables fast lookup.
    - first_name, last_name, date_of_birth, gender: ENCRYPTED — direct PHI
      per HIPAA Safe Harbor method.

    Storage format: base64(IV[12] + ciphertext + GCM_tag[16])
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), nullable=False, index=True)  # unencrypted for indexing

    # Encrypted PHI fields (AES-256-GCM, base64 encoded)
    first_name = Column(Text, nullable=False)       # encrypted
    last_name = Column(Text, nullable=False)        # encrypted
    date_of_birth = Column(Text, nullable=False)    # encrypted
    gender = Column(Text, nullable=False)           # encrypted

    upload_batch_id = Column(Integer, ForeignKey("patient_upload_batches.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    upload_batch = relationship("PatientUploadBatch", back_populates="patients")

    __table_args__ = (
        Index("ix_patients_batch_patient", "upload_batch_id", "patient_id"),
    )


# ── Audit Trail ───────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)      # LOGIN, LOGOUT, VIEW_PATIENTS, etc.
    resource = Column(String(100), nullable=True)     # patients, users, etc.
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(20), default="success")    # success, failure
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
    __table_args__ = (Index("ix_audit_user_action", "user_id", "action"),)
