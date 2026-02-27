from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging

from app.config import settings
from app.database import create_tables
from app.routers import products, auth, prices, cart, users
from app.routers import twofa, oauth as oauth_router
from app.routers import product_images, orders, brands
from app.core.limiter import limiter
from app.core import storage  # MinIO

logger = logging.getLogger("lookaly")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear tablas si no existen
    await create_tables()
    # Inicializar MinIO: crear bucket si no existe y aplicar política pública
    await storage.init_storage()
    # Crear el directorio de imágenes si no existe (fallback dev)
    images_dir = Path(__file__).parent.parent / "static" / "images" / "products"
    images_dir.mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown: nada por ahora


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Registrar slowapi en la app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── 1. CORS — solo acepta requests del origen autorizado ─────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# ─── 2. Security Headers Middleware ───────────────────────────────────────────
# Agrega cabeceras HTTP que mitigan ataques comunes:
#   • X-Content-Type-Options: evita MIME sniffing
#   • X-Frame-Options: evita clickjacking (iframes maliciosos)
#   • Strict-Transport-Security: fuerza HTTPS en producción
#   • Content-Security-Policy: restringe orígenes de scripts/estilos
#   • Referrer-Policy: no filtra URL en cabecera Referer
#   • X-XSS-Protection: capa de protección en navegadores legacy
@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "img-src 'self' data: https:; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self'"
    )
    # Ocultar tecnología del servidor
    response.headers["Server"] = "Lookaly"
    return response

# Routers
app.include_router(auth.router,           prefix="/api/auth",                          tags=["Auth"])
app.include_router(twofa.router,          prefix="/api/auth/2fa",                      tags=["2FA"])
app.include_router(oauth_router.router,   prefix="/api/auth",                          tags=["OAuth"])
app.include_router(users.router,          prefix="/api/users",                         tags=["Users"])
app.include_router(products.router,       prefix="/api/products",                      tags=["Products"])
app.include_router(product_images.router, prefix="/api/products/{product_id}/images",  tags=["Product Images"])
app.include_router(prices.router,         prefix="/api/prices",                        tags=["Prices"])
app.include_router(cart.router,           prefix="/api/cart",                          tags=["Cart"])
app.include_router(orders.router,         prefix="/api/orders",                        tags=["Orders"])
app.include_router(brands.router,         prefix="/api/brands",                        tags=["Brands"])

# ── Archivos estáticos (fotos de productos) ────────────────────────────────────
# Las fotos se sirven en  GET /static/images/products/<nombre>.jpg
# Para agregar fotos: copia el archivo a  backend/static/images/products/
# En el CSV escribe:  products/nombre-del-archivo.jpg
_static_dir = Path(__file__).parent.parent / "static"
_static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


# ─── 3. Manejadores de errores (3.5) ──────────────────────────────────────────
# ¡NUNCA devolver stack traces al cliente en producción!
# El stack trace se loguea internamente pero el cliente solo ve un mensaje genérico.

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Errores de validación Pydantic (422).
    Devuelve los errores de campo de forma legible pero SIN exponer lógica interna.
    """
    errors = [
        {"campo": " → ".join(str(loc) for loc in err["loc"]), "mensaje": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": "Datos de entrada inválidos", "errores": errors})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler de último recurso para excepciones no controladas (500).
    - Loguea el stack trace completo INTERNAMENTE para el equipo de desarrollo.
    - Devuelve al cliente un mensaje genérico SIN información interna.
    Esto evita que el atacante conozca la tecnología, rutas internas o estructura.
    """
    logger.exception("Error no controlado en %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. El equipo ha sido notificado."},
    )


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
