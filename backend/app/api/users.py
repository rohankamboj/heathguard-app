from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import hash_password
from app.core.deps import get_current_user, require_role, log_audit
from app.models.models import User, Role, Location, Team
from app.schemas.schemas import UserCreate, UserUpdate, UserOut, UserSummary, RoleOut, LocationOut, TeamOut

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserSummary])
async def list_users(
    role_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    team_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    if current_user.role.name == "manager":
        # Managers only see users in their location
        query = query.filter(User.location_id == current_user.location_id)

    if role_id:
        query = query.filter(User.role_id == role_id)
    if location_id:
        query = query.filter(User.location_id == location_id)
    if team_id:
        query = query.filter(User.team_id == team_id)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term))
        )

    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    # Check uniqueness
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate FKs
    if not db.query(Role).filter(Role.id == body.role_id).first():
        raise HTTPException(status_code=400, detail="Role not found")
    if not db.query(Location).filter(Location.id == body.location_id).first():
        raise HTTPException(status_code=400, detail="Location not found")
    if not db.query(Team).filter(Team.id == body.team_id).first():
        raise HTTPException(status_code=400, detail="Team not found")

    user = User(
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role_id=body.role_id,
        location_id=body.location_id,
        team_id=body.team_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_audit(db, current_user.id, "CREATE_USER", resource="users", resource_id=str(user.id))
    return user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role.name == "manager" and user.location_id != current_user.location_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    body: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    log_audit(db, current_user.id, "UPDATE_USER", resource="users", resource_id=str(user_id))
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    log_audit(db, current_user.id, "DEACTIVATE_USER", resource="users", resource_id=str(user_id))


@router.post("/{user_id}/unlock")
async def unlock_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_locked = False
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    log_audit(db, current_user.id, "UNLOCK_USER", resource="users", resource_id=str(user_id))
    return {"message": f"User {user.username} unlocked"}


# ── Reference Data ────────────────────────────────────────────────────────────

@router.get("/meta/roles", response_model=List[RoleOut])
async def get_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Role).filter(Role.is_active == True).all()


@router.get("/meta/locations", response_model=List[LocationOut])
async def get_locations(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Location).filter(Location.is_active == True).all()


@router.get("/meta/teams", response_model=List[TeamOut])
async def get_teams(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Team).filter(Team.is_active == True).all()
