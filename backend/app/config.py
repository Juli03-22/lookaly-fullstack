"""
Configuración central de la aplicación.
TODOS los secretos y URLs se leen desde variables de entorno / archivo .env.
Nunca deben estar hardcodeados en código fuente (ver .gitignore y .env.example).
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "Lookaly API"
    APP_VERSION: str = "0.1.0"
    # DEBUG=True expone /docs y trazas detalladas de errores.
    # En producción DEBE ser False (se gestiona vía variable de entorno).
    DEBUG: bool = True

    # ── Base de datos (valor solo para desarrollo local) ───────────────────
    DATABASE_URL: str = "postgresql+asyncpg://lookaly:lookalypass@db:5432/lookaly_db"

    # ── Auth / JWT ──────────────────────────────────────────────────
    # Genera una clave segura con: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "insecure-dev-key-CHANGE-before-deploy-run-secrets.token_hex"
    ALGORITHM: str = "HS256"      # HMAC-SHA256; en alta seguridad usar RS256
    # Access token CORTO (3.4): limita el daño si es capturado. Minúmero 15-30 min.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Refresh token LARGO (3.4): rota el access token sin nueva autenticación.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Política de contraseñas (3.2) ─────────────────────────────────
    PASSWORD_MIN_LENGTH: int = 8    # Mínimo absoluto
    PASSWORD_MAX_LENGTH: int = 72   # Tope de bcrypt (bytes); pasphrase siguen siendo seguros
    # Caducidad de contraseña: 0 = sin caducidad (para uso en producción corporativa, set > 0)
    PASSWORD_EXPIRE_DAYS: int = 0

    # ── CORS ──────────────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    # ── Google OAuth ──────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://localhost/api/auth/google/callback"

    model_config = {"env_file": ".env", "case_sensitive": True}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
