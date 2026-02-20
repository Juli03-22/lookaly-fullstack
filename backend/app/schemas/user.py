from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import re

# ─── Regex patterns ───────────────────────────────────────────────────────────
# Nombre: letras, tildes, espacios, guiones y apóstrofes — sin caracteres especiales
NAME_REGEX = re.compile(r"^[\w\s'\-\u00C0-\u024F]{2,100}$")
# Contraseña: mínimo 8 chars, al menos 1 mayúscula, 1 número, 1 carácter especial
PASSWORD_REGEX = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,72}$")


class UserBase(BaseModel):
    email: EmailStr = Field(
        max_length=254,
        description="Correo electrónico válido (RFC 5321, máx 254 caracteres)",
    )
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Nombre completo — solo letras, tildes, espacios y guiones",
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not NAME_REGEX.match(v):
            raise ValueError(
                "El nombre solo puede contener letras, espacios, guiones y apóstrofes"
            )
        return v


class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        max_length=72,  # bcrypt ignora > 72 bytes
        description="Mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 símbolo",
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres, "
                "una mayúscula, un número y un carácter especial (!@#$…)"
            )
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(default=None, max_length=254)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not NAME_REGEX.match(v):
            raise ValueError(
                "El nombre solo puede contener letras, espacios, guiones y apóstrofes"
            )
        return v


class UserOut(UserBase):
    id: str
    is_active: bool
    is_admin: bool
    totp_enabled: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    # refresh_token solo se devuelve en respuesta JSON (no en mode cookie)
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
