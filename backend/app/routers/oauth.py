"""
Router de Google OAuth 2.0

Flujo:
  1. Frontend llama GET /api/auth/google/url  → recibe la URL de Google
  2. Frontend redirige al usuario a esa URL
  3. Google redirige a /api/auth/google/callback?code=...
  4. Backend intercambia el código, crea/busca al usuario y redirige
     al frontend con el JWT en query param: /auth-callback?token=...
"""
import secrets
from datetime import datetime
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.core.security import hash_password, create_access_token

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


# ─── 1. Devuelve la URL de autorización de Google ────────────────────────────
@router.get("/google/url")
async def google_oauth_url():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Google OAuth no está configurado. Agrega GOOGLE_CLIENT_ID al .env")

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return {"url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}


# ─── 2. Callback — Google redirige aquí con el code ──────────────────────────
@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Google OAuth no está configurado")

    # Intercambiar code por access_token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id":     settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code":          code,
            "grant_type":    "authorization_code",
            "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        })
        if token_resp.status_code != 200:
            raise HTTPException(400, "Error al intercambiar el código con Google")
        token_data = token_resp.json()

        # Obtener información del usuario de Google
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(400, "No se pudo obtener el perfil de Google")
        userinfo = userinfo_resp.json()

    google_email = userinfo.get("email")
    google_name  = userinfo.get("name", google_email.split("@")[0])
    google_id    = userinfo.get("sub")

    if not google_email:
        raise HTTPException(400, "Google no proporcionó un email")

    # Buscar usuario existente por email
    result = await db.execute(select(User).where(User.email == google_email))
    user = result.scalar_one_or_none()

    if user:
        # Vincular Google ID si no lo tiene aún
        if not user.google_id:
            user.google_id = google_id
            await db.commit()
    else:
        # Crear cuenta nueva (sin contraseña funcional — solo login por Google)
        user = User(
            email=google_email,
            name=google_name,
            google_id=google_id,
            hashed_password=hash_password(secrets.token_hex(32)),  # hash inutilizable
            is_active=True,
            password_changed_at=datetime.utcnow(),
        )
        db.add(user)
        await db.flush()
        await db.commit()

    access_token = create_access_token({"sub": user.id})

    # Redirigir al frontend con el token
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth-callback?token={access_token}")
