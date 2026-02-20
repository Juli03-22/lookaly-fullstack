"""
Módulo de seguridad — Lookaly
================================
Implementa las siguientes prácticas de seguridad:

  3.2 – Hashing de contraseñas con bcrypt
  ─────────────────────────────────────────
  • Algoritmo: bcrypt (diseñado específicamente para contraseñas, factor de trabajo adaptable)
  • Salt: passlib genera un SALT ALEATORIO Único por contraseña de forma automática
    El salt queda embebido en el hash resultante ($2b$12$<salt><hash>).
    No se almacena por separado; la función verify() lo extrae del hash.
  • Work factor (rounds): 12 (por defecto en passlib)
    — cada incremento duplica el tiempo de cómputo, dificultando fuerza bruta.

  3.4 – Tokens JWT de vida corta + Refresh Token
  ─────────────────────────────────────────────────
  • Access token: expira en ACCESS_TOKEN_EXPIRE_MINUTES (default 30 min)
  • Refresh token: vida larga (REFRESH_TOKEN_EXPIRE_DAYS), firmado con clave diferente
  • Revocación: set en memoria _revoked_tokens (en prod: Redis + lista de denegación)
  • HttpOnly cookies: helper set_auth_cookies() para endpoints que las requieran
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenData

# ─── bcrypt directo ───────────────────────────────────────────────────────────────────
# gensalt(rounds=12): salt de 22 chars en base64, embebido en el hash final.
# Hash resultante: $2b$12$<22 chars salt><31 chars hash>  (60 chars totales)
_BCRYPT_ROUNDS = 12

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ─── Revocación de tokens en memoria ─────────────────────────────────────────
# En producción, usar Redis con TTL igual a la vida del token.
_revoked_tokens: set[str] = set()


def hash_password(password: str) -> str:
    """
    Genera hash bcrypt con salt único aleatorio por contraseña.
    La contraseña en texto plano NUNCA se persiste.
    Formato resultante: $2b$12$<22 chars salt><31 chars hash>
    """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """
    Comparación timing-safe usando el salt embebido en el hash.
    Devuelve False si la contraseña no coincide (nunca revela cuál parte falló).
    """
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _make_jwt(data: dict, expires_delta: timedelta, token_type: str) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    payload["type"] = token_type  # distingue access vs refresh
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(data: dict) -> str:
    """
    JWT de vida corta (ACCESS_TOKEN_EXPIRE_MINUTES = {} min).
    Contiene: sub (user_id), exp, type='access'.
    """.format(settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _make_jwt(data, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access")


def create_refresh_token(data: dict) -> str:
    """
    JWT de vida larga (REFRESH_TOKEN_EXPIRE_DAYS días).
    Solo sirve para obtener un nuevo access token.
    Contiene: sub (user_id), exp, type='refresh'.
    """
    return _make_jwt(data, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh")


def revoke_token(token: str) -> None:
    """Agrega el token a la lista de denegación (logout / rotación)."""
    _revoked_tokens.add(token)


def is_token_revoked(token: str) -> bool:
    return token in _revoked_tokens


# ─── Cookies HttpOnly ─────────────────────────────────────────────────────────
def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """
    Establece los tokens como cookies HttpOnly + Secure + SameSite=Lax.
    • HttpOnly: JavaScript del navegador NO puede leer la cookie (mitiga XSS).
    • Secure: solo se envía por HTTPS (aplica en producción).
    • SameSite=Lax: protege contra CSRF en navegación cruzada.
    """
    access_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        max_age=access_max_age,
        httponly=True,          # inaccessible a JS
        secure=not settings.DEBUG,  # solo HTTPS en produccion
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        path="/api/auth/refresh",  # ruta restringida
    )


def clear_auth_cookies(response: Response) -> None:
    """Elimina cookies de auth al hacer logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth/refresh")


# ─── Dependencias de FastAPI ──────────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        # Mensaje genérico: no revela si el token expiró o si el usuario no existe
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Verificar si el token fue revocado (logout)
    if is_token_revoked(token):
        raise credentials_exc
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Verificar que sea un access token (no un refresh reutilizado maliciosamente)
        if payload.get("type") != "access":
            raise credentials_exc
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exc

    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exc
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return current_user
