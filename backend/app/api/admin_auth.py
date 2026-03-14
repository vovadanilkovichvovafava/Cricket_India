"""Admin authentication — separate from user auth, with invite system."""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.core.rate_limiter import limiter

router = APIRouter(tags=["admin-auth"])

admin_security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"
ACCESS_EXPIRE_HOURS = 24
REFRESH_EXPIRE_DAYS = 30


# ── Pydantic schemas ───────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminRegisterRequest(BaseModel):
    invite_code: str
    username: str
    password: str
    name: str


class AdminInviteCreateRequest(BaseModel):
    role: str = "admin"
    expires_hours: int = 72


class RefreshRequest(BaseModel):
    refresh_token: str


# ── JWT helpers ─────────────────────────────────────

def _create_admin_token(admin_id: int, username: str, role: str, token_type: str = "admin") -> str:
    expire = datetime.now(timezone.utc) + (
        timedelta(hours=ACCESS_EXPIRE_HOURS) if token_type == "admin"
        else timedelta(days=REFRESH_EXPIRE_DAYS)
    )
    return jwt.encode(
        {"sub": username, "admin_id": admin_id, "role": role, "type": token_type, "exp": expire},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def _decode_admin_token(token: str, expected_type: str = "admin") -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Dependency ──────────────────────────────────────

async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(admin_security),
    db: Session = Depends(get_db),
) -> dict:
    """Decode admin JWT and return admin payload dict."""
    from app.models.admin import AdminUser

    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = _decode_admin_token(credentials.credentials, "admin")
    admin_id = payload.get("admin_id")

    admin = db.query(AdminUser).filter(AdminUser.id == admin_id, AdminUser.is_active == True).first()
    if admin is None:
        raise HTTPException(status_code=401, detail="Admin not found or deactivated")

    return {
        "admin_id": admin.id,
        "username": admin.username,
        "name": admin.name,
        "role": admin.role,
    }


# ── Endpoints ───────────────────────────────────────

def require_admin_role(*allowed_roles: str):
    """Dependency: require admin to have one of the specified roles."""
    async def _check(admin: dict = Depends(get_current_admin)):
        if admin["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return admin
    return _check


@router.post("/bootstrap")
@limiter.limit("2/hour")
async def bootstrap(request: Request, db: Session = Depends(get_db)):
    """Create the first owner invite. Only works when zero admins exist."""
    from app.models.admin import AdminUser, AdminInvite

    count = db.query(AdminUser).count()
    if count > 0:
        raise HTTPException(status_code=403, detail="Bootstrap already done — admins exist")

    code = f"adm_{secrets.token_urlsafe(12)}"
    invite = AdminInvite(code=code, role="superadmin", created_by=0)
    db.add(invite)
    db.commit()

    return {"invite_code": code, "message": "Use this code to register the first admin"}


@router.post("/register")
@limiter.limit("3/hour")
async def register(body: AdminRegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new admin using an invite code."""
    from app.models.admin import AdminUser, AdminInvite

    # Validate invite
    invite = db.query(AdminInvite).filter(
        AdminInvite.code == body.invite_code,
        AdminInvite.is_used == False,
    ).first()
    if invite is None:
        raise HTTPException(status_code=400, detail="Invalid or used invite code")

    # Check username uniqueness
    existing = db.query(AdminUser).filter(AdminUser.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    # Create admin
    admin = AdminUser(
        username=body.username,
        hashed_password=hash_password(body.password),
        name=body.name,
        role=invite.role,
    )
    db.add(admin)
    db.flush()

    # Mark invite as used
    invite.is_used = True
    invite.used_by = admin.id
        invite.used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(admin)

    access_token = _create_admin_token(admin.id, admin.username, admin.role, "admin")
    refresh_token = _create_admin_token(admin.id, admin.username, admin.role, "admin_refresh")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "name": admin.name,
            "role": admin.role,
        },
    }


@router.post("/login")
@limiter.limit("5/minute")
async def login(body: AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login with username + password."""
    from app.models.admin import AdminUser

    admin = db.query(AdminUser).filter(
        AdminUser.username == body.username,
        AdminUser.is_active == True,
    ).first()

    if admin is None or not verify_password(body.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Update last login
    admin.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = _create_admin_token(admin.id, admin.username, admin.role, "admin")
    refresh_token = _create_admin_token(admin.id, admin.username, admin.role, "admin_refresh")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "name": admin.name,
            "role": admin.role,
        },
    }


@router.post("/refresh")
async def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token."""
    payload = _decode_admin_token(body.refresh_token, "admin_refresh")

    from app.models.admin import AdminUser
    admin = db.query(AdminUser).filter(
        AdminUser.id == payload["admin_id"],
        AdminUser.is_active == True,
    ).first()
    if admin is None:
        raise HTTPException(status_code=401, detail="Admin not found")

    access_token = _create_admin_token(admin.id, admin.username, admin.role, "admin")
    refresh_token = _create_admin_token(admin.id, admin.username, admin.role, "admin_refresh")

    return {"access_token": access_token, "refresh_token": refresh_token}


@router.get("/me")
async def get_me(current_admin: dict = Depends(get_current_admin)):
    """Get current admin profile."""
    return current_admin


@router.get("/team")
async def get_team(
    current_admin: dict = Depends(require_admin_role("superadmin", "owner")),
    db: Session = Depends(get_db),
):
    """List all admin users."""
    from app.models.admin import AdminUser

    admins = db.query(AdminUser).order_by(AdminUser.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "username": a.username,
            "name": a.name,
            "role": a.role,
            "is_active": a.is_active,
            "last_login_at": a.last_login_at.isoformat() if a.last_login_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in admins
    ]


@router.post("/invites")
async def create_invite(
    body: AdminInviteCreateRequest,
    current_admin: dict = Depends(require_admin_role("superadmin", "owner")),
    db: Session = Depends(get_db),
):
    """Create an invite code for a new admin."""
    from app.models.admin import AdminInvite

    # Role hierarchy: superadmin can invite anyone, admin can invite editors
    if current_admin["role"] not in ("superadmin", "owner"):
        if body.role in ("superadmin", "owner"):
            raise HTTPException(status_code=403, detail="Cannot create invite with higher role")

    code = f"adm_{secrets.token_urlsafe(12)}"
    invite = AdminInvite(
        code=code,
        role=body.role,
        created_by=current_admin["admin_id"],
    )
    db.add(invite)
    db.commit()

    return {"code": code, "role": body.role}


@router.get("/invites")
async def get_invites(
    current_admin: dict = Depends(require_admin_role("superadmin", "owner")),
    db: Session = Depends(get_db),
):
    """List all invite codes."""
    from app.models.admin import AdminInvite

    invites = db.query(AdminInvite).order_by(AdminInvite.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "code": i.code,
            "role": i.role,
            "is_used": i.is_used,
            "created_by": i.created_by,
            "used_by": i.used_by,
            "created_at": i.created_at.isoformat() if i.created_at else None,
            "used_at": i.used_at.isoformat() if i.used_at else None,
        }
        for i in invites
    ]
