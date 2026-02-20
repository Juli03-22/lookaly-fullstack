"""
Router de autenticación de dos factores (2FA) — TOTP via Google Authenticator

3.4 – El usuario puede activar 2FA opcional en su perfil.
Flujo:
  1. POST /setup   → genera secret + imagen QR en base64
  2. POST /confirm → el usuario escanea el QR y envía el primer código para validar
  3. POST /disable → desactiva 2FA (requiere código TOTP vigente)
"""
import io
import base64
import pyotp
import qrcode

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()


class CodeIn(BaseModel):
    code: str


# ─── 1. Setup — genera secret y QR ──────────────────────────────────────────
@router.post("/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Genera un nuevo secreto TOTP y la imagen QR para escanearlo.
    No activa 2FA hasta que el usuario confirme con /confirm.
    """
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    await db.commit()

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="Lookaly")

    img = qrcode.make(uri)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_b64 = base64.b64encode(buffer.getvalue()).decode()

    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_b64}",
    }


# ─── 2. Confirm — verifica el primer código y activa 2FA ─────────────────────
@router.post("/confirm")
async def confirm_2fa(
    body: CodeIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.totp_secret:
        raise HTTPException(400, "Primero llama a /setup")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(400, "Código incorrecto. Asegúrate de que el reloj de tu dispositivo esté sincronizado.")

    current_user.totp_enabled = True
    await db.commit()
    return {"detail": "2FA activado correctamente"}


# ─── 3. Disable — desactiva con código válido ────────────────────────────────
@router.post("/disable")
async def disable_2fa(
    body: CodeIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.totp_enabled:
        raise HTTPException(400, "El 2FA no está activo")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(400, "Código incorrecto")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    await db.commit()
    return {"detail": "2FA desactivado"}


# ─── 4. Status — saber si el usuario tiene 2FA activo ────────────────────────
@router.get("/status")
async def twofa_status(current_user: User = Depends(get_current_user)):
    return {"totp_enabled": current_user.totp_enabled}
