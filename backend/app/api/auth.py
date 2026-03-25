from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.deps import get_current_user, log_audit
from app.models.models import User
from app.schemas.schemas import LoginRequest, TokenResponse, RefreshRequest, UserOut
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")

    # Find user
    user = db.query(User).filter(
        (User.username == body.username) | (User.email == body.username)
    ).first()

    def fail(msg: str):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.is_locked = True
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
                logger.warning(f"Account locked: {user.username}")
            db.commit()
            log_audit(db, user.id, "LOGIN_FAILED", ip_address=ip, user_agent=ua, status="failure", details=msg)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    if not user:
        fail("Invalid credentials")

    if not user.is_active:
        fail("Account is deactivated")

    if user.is_locked:
        if user.locked_until and user.locked_until > datetime.utcnow():
            minutes_left = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked. Try again in {minutes_left} minute(s).",
            )
        else:
            user.is_locked = False
            user.failed_login_attempts = 0
            user.locked_until = None

    if not verify_password(body.password, user.hashed_password):
        fail("Invalid credentials")

    # Success
    user.failed_login_attempts = 0
    user.is_locked = False
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()

    token_data = {"sub": str(user.id), "role": user.role.name}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    log_audit(db, user.id, "LOGIN", ip_address=ip, user_agent=ua)
    logger.info(f"Login success: {user.username} ({user.role.name})")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    token_data = {"sub": str(user.id), "role": user.role.name}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"
    log_audit(db, current_user.id, "LOGOUT", ip_address=ip)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
