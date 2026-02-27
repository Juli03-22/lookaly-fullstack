"""
Router de imágenes de producto.

Admin endpoints:
  POST   /api/products/{product_id}/images/upload     — subir archivo (MinIO)
  POST   /api/products/{product_id}/images            — agregar por URL
  PATCH  /api/products/{product_id}/images/{id}       — editar (url, order, primary)
  DELETE /api/products/{product_id}/images/{id}       — eliminar imagen
  POST   /api/products/{product_id}/images/{id}/set-primary  — marcar como principal
"""
import uuid as _uuid_mod

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.product import Product
from app.models.product_image import ProductImage
from app.schemas.product_image import ProductImageCreate, ProductImageUpdate, ProductImageOut
from app.core.security import get_current_admin, require_role

_can_manage = require_role('gestor_inventario', 'vendedor')
from app.core import storage

router = APIRouter()


async def _get_product_or_404(product_id: str, db: AsyncSession) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


async def _get_image_or_404(image_id: str, product_id: str, db: AsyncSession) -> ProductImage:
    result = await db.execute(
        select(ProductImage).where(
            ProductImage.id == image_id,
            ProductImage.product_id == product_id,
        )
    )
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return img


@router.get("", response_model=list[ProductImageOut])
async def list_images(
    product_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Lista todas las imágenes de un producto (público)."""
    await _get_product_or_404(product_id, db)
    result = await db.execute(
        select(ProductImage)
        .where(ProductImage.product_id == product_id)
        .order_by(ProductImage.sort_order)
    )
    return result.scalars().all()


@router.post("", response_model=ProductImageOut, status_code=status.HTTP_201_CREATED)
async def add_image(
    product_id: str,
    data: ProductImageCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_can_manage),
):
    """Agrega una imagen al producto. Solo gestor_inventario o vendedor."""
    await _get_product_or_404(product_id, db)

    # Si es primary, quitar el flag de las otras
    if data.is_primary:
        existing = await db.execute(
            select(ProductImage).where(
                ProductImage.product_id == product_id,
                ProductImage.is_primary == True,  # noqa: E712
            )
        )
        for img in existing.scalars().all():
            img.is_primary = False

    import uuid
    new_img = ProductImage(
        id=str(uuid.uuid4()),
        product_id=product_id,
        **data.model_dump(),
    )
    db.add(new_img)
    await db.flush()
    await db.refresh(new_img)
    return new_img


# ── IMPORTANTE: /upload debe declararse ANTES de /{image_id} ──────────────────
@router.post("/upload", response_model=ProductImageOut, status_code=status.HTTP_201_CREATED)
async def upload_image_file(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_can_manage),
):
    """
    Sube un archivo de imagen para el producto.
    - Acepta JPEG, PNG, WEBP, GIF (máx. 20 MB).
    - Recorta al cuadrado central 1:1 y redimensiona a 800×800 JPEG.
    - Almacena en MinIO y guarda la URL pública en la DB.
    Solo gestor_inventario o vendedor.
    """
    # Validar tipo MIME
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    content_type = (file.content_type or "").lower()
    if content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido: {content_type}. Usa JPEG, PNG, WEBP o GIF.",
        )

    # Validar tamaño (20 MB)
    MAX_SIZE = 20 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="El archivo supera el límite de 20 MB.")

    await _get_product_or_404(product_id, db)

    # Subir a MinIO (recorte + resize se hacen en storage.upload_product_image)
    public_url = await storage.upload_product_image(product_id, file_bytes)

    # Determinar si es la primera imagen (marcar como principal)
    existing_count_q = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    is_first = len(existing_count_q.scalars().all()) == 0
    if not is_first:
        is_primary = False
    else:
        is_primary = True

    new_img = ProductImage(
        id=str(_uuid_mod.uuid4()),
        product_id=product_id,
        url=public_url,
        is_primary=is_primary,
        sort_order=0,
    )
    db.add(new_img)
    await db.flush()
    await db.refresh(new_img)
    return new_img


@router.patch("/{image_id}", response_model=ProductImageOut)
async def update_image(
    product_id: str,
    image_id: str,
    data: ProductImageUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_can_manage),
):
    """Edita URL, orden o primary de una imagen. Solo gestor_inventario o vendedor."""
    img = await _get_image_or_404(image_id, product_id, db)

    if data.is_primary is True:
        existing = await db.execute(
            select(ProductImage).where(
                ProductImage.product_id == product_id,
                ProductImage.is_primary == True,  # noqa: E712
            )
        )
        for other in existing.scalars().all():
            other.is_primary = False

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(img, field, value)

    await db.flush()
    await db.refresh(img)
    return img


@router.post("/{image_id}/set-primary", response_model=ProductImageOut)
async def set_primary(
    product_id: str,
    image_id: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_can_manage),
):
    """Marca esta imagen como la principal del producto. Solo gestor_inventario o vendedor."""
    await _get_product_or_404(product_id, db)

    # Quitar primary de todas
    existing = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    for other in existing.scalars().all():
        other.is_primary = False

    # Marcar la nueva
    img = await _get_image_or_404(image_id, product_id, db)
    img.is_primary = True

    await db.flush()
    await db.refresh(img)
    return img


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    product_id: str,
    image_id: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_can_manage),
):
    """Elimina una imagen de la DB y de MinIO. Solo gestor_inventario o vendedor."""
    img = await _get_image_or_404(image_id, product_id, db)
    # Intentar borrar de MinIO (silencioso si no está allí, p.ej. URLs externas)
    await storage.delete_product_image(img.url)
    await db.delete(img)
