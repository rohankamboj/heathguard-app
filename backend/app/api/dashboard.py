from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Patient, PatientUploadBatch, Role, Location, Team
from app.schemas.schemas import DashboardStats, UserSummary
from typing import List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = current_user.role.name

    # Base user query scoped by role
    if role == "admin":
        user_query = db.query(User)
    elif role == "manager":
        user_query = db.query(User).filter(User.location_id == current_user.location_id)
    else:
        user_query = db.query(User).filter(User.id == current_user.id)

    total_users = user_query.count()
    active_users = user_query.filter(User.is_active == True).count()

    # Location breakdown
    loc_counts = (
        db.query(Location.code, func.count(User.id))
        .join(User, User.location_id == Location.id)
        .group_by(Location.code)
        .all()
    )

    # Team breakdown
    team_counts = (
        db.query(Team.code, func.count(User.id))
        .join(User, User.team_id == Team.id)
        .group_by(Team.code)
        .all()
    )

    stats = DashboardStats(
        total_users=total_users,
        active_users=active_users,
        locations={k: v for k, v in loc_counts},
        teams={k: v for k, v in team_counts},
    )

    if role == "admin":
        role_counts = (
            db.query(Role.name, func.count(User.id))
            .join(User, User.role_id == Role.id)
            .group_by(Role.name)
            .all()
        )
        stats.roles = {k: v for k, v in role_counts}

    if role == "manager":
        stats.my_patients = (
            db.query(func.count(Patient.id))
            .filter(Patient.uploaded_by == current_user.id, Patient.is_active == True)
            .scalar()
        )
        stats.recent_uploads = (
            db.query(func.count(PatientUploadBatch.id))
            .filter(PatientUploadBatch.uploaded_by == current_user.id)
            .scalar()
        )
        stats.total_patients = stats.my_patients

    return stats


@router.get("/users", response_model=List[UserSummary])
async def get_dashboard_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the user list shown on each dashboard."""
    role = current_user.role.name

    if role == "admin":
        users = db.query(User).all()
    elif role == "manager":
        users = db.query(User).filter(User.location_id == current_user.location_id).all()
    else:
        users = [current_user]

    return users
