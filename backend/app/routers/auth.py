"""
Router de autenticación — endpoints: /register, /login, /refresh, /logout, /me

3.2  Contraseñas: hash bcrypt con salt único, nunca texto plano.
3.4  Tokens: access de vida corta (30 min) + refresh de vida larga (7 días).
     HttpOnly cookies opcionales (pasar use_cookies=true).
3.5  Errores: mensajes genéricos para no revelar información sensible.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    revoke_token, is_token_revoked,
    set_auth_cookies, clear_auth_cookies,
    get_current_user, oauth2_scheme,
)
from app.core.sanitize import sanitize_str
from app.config import settings
from app.core.limiter import limiter  # 4.2: rate limiting anti fuerza bruta

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # 4.2: max 5 registros por minuto por IP
async def register(request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Registro con:
    - Sanitización XSS de entradas
    - Validación de email único (regla de negocio)
    - Contraseña hasheada con bcrypt + salt aleatorio automático
    - Registro de password_changed_at (para política de caducidad)
    """
    clean_name = sanitize_str(data.name)
    clean_email = sanitize_str(data.email)

    result = await db.execute(select(User).where(User.email == clean_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=clean_email,
        name=clean_name,
        hashed_password=hash_password(data.password),  # bcrypt + salt único automático
        password_changed_at=datetime.utcnow(),          # para política de caducidad
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")  # 4.2: max 10 intentos de login por minuto por IP (anti fuerza bruta)
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    use_cookies: bool = Query(False, description="Si True, envía tokens como cookies HttpOnly"),
    totp_code: Optional[str] = Query(None, description="Código 2FA de 6 dígitos (si está activo)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Login con:
    - Mensaje genérico de error (no revela si el email existe — evita user enumeration)
    - Verificación timing-safe con bcrypt
    - Devuelve access token (30 min) + refresh token (7 días)
    - use_cookies=True: establece tokens como cookies HttpOnly + Secure + SameSite=Lax
    """
    clean_email = sanitize_str(form_data.username)
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()

    # Mensaje único — no revela si el email existe (evita user enumeration)
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Cuenta desactivada")

    # ── Verificación 2FA (si está activo) ──────────────────────────────
    if user.totp_enabled:
        if not totp_code:
            raise HTTPException(status_code=428, detail="2fa_required")
        import pyotp
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            raise HTTPException(status_code=401, detail="Código 2FA incorrecto")

    # ── Política de caducidad de contraseña (3.2) ──────────────────────────
    if settings.PASSWORD_EXPIRE_DAYS > 0 and user.password_changed_at:
        from datetime import timedelta
        delta = datetime.utcnow() - user.password_changed_at.replace(tzinfo=None)
        if delta.days >= settings.PASSWORD_EXPIRE_DAYS:
            raise HTTPException(status_code=403, detail="Tu contraseña ha caducado. Por favor cámbiala.")

    payload = {"sub": user.id}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    if use_cookies:
        set_auth_cookies(response, access_token, refresh_token)
        return Token(access_token="", token_type="cookie")

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(
    response: Response,
    refresh_token: str = Query(..., description="Refresh token obtenido en /login"),
    use_cookies: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """
    Rota el access token usando el refresh token.
    - Verifica que sea tipo 'refresh' (no un access token reutilizado maliciosamente)
    - Verifica que no esté revocado (logout previo)
    - Rota el refresh token: invalida el anterior, emite uno nuevo
    """
    credentials_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido o expirado")
    if is_token_revoked(refresh_token):
        raise credentials_exc
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exc
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise credentials_exc

    revoke_token(refresh_token)  # rotación: invalida el refresh token usado
    new_access = create_access_token({"sub": user.id})
    new_refresh = create_refresh_token({"sub": user.id})

    if use_cookies:
        set_auth_cookies(response, new_access, new_refresh)
        return Token(access_token="", token_type="cookie")

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
):
    """
    Invalida el access token (lista de revocados in-memory).
    En producción: Redis con TTL = vida restante del token.
    Limpia las cookies HttpOnly si se usaron.
    """
    revoke_token(token)
    clear_auth_cookies(response)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
