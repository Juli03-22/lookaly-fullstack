"""
storage.py — Integración con MinIO (S3-compatible).

Responsabilidades:
  • Crear el bucket al arrancar si no existe.
  • Aplicar política pública de lectura para que nginx pueda servir las imágenes.
  • Proveer helpers para subir y eliminar objetos.
  • Procesar imágenes: recorte central 1:1 + resize a 800×800 JPEG.

Las imágenes se almacenan en:
    {bucket}/{object_key}   e.g.  lookaly/products/{product_id}/{uuid}.jpg

La URL pública almacenada en DB es:
    {MINIO_PUBLIC_BASE}/{object_key}  e.g.  /media/products/{product_id}/{uuid}.jpg
"""
import io
import uuid
import json
import logging
import asyncio
from functools import partial

import boto3
from botocore.exceptions import ClientError
from PIL import Image

from app.config import get_settings

logger = logging.getLogger("lookaly.storage")

# ── Cliente S3/MinIO (síncrono — se llama en executor para no bloquear) ────────

def _make_client():
    s = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=s.MINIO_ENDPOINT,
        aws_access_key_id=s.MINIO_ACCESS_KEY,
        aws_secret_access_key=s.MINIO_SECRET_KEY,
        region_name="us-east-1",   # MinIO ignora el valor pero boto3 lo requiere
    )


# ── Política pública de lectura para el bucket ─────────────────────────────────

def _public_policy(bucket: str) -> str:
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": "*"},
            "Action": "s3:GetObject",
            "Resource": f"arn:aws:s3:::{bucket}/*",
        }],
    })


# ── Procesamiento de imagen: recorte cuadrado 1:1 + resize 800×800 ─────────────

def _process_image(data: bytes, size: int = 800) -> bytes:
    """
    Recorta la imagen al cuadrado central y la redimensiona a size×size JPEG.
    Esto estandariza todas las fotos de producto a relación 1:1 (estilo Amazon).
    """
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")          # elimina canal alpha (PNG, WEBP, etc.)

    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top  = (h - side) // 2
    img  = img.crop((left, top, left + side, top + side))
    img  = img.resize((size, size), Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=85, optimize=True)
    return out.getvalue()


# ── Operaciones sobre MinIO (síncronas, llamar con run_in_executor) ─────────────

def _ensure_bucket(client, bucket: str) -> None:
    try:
        client.head_bucket(Bucket=bucket)
        logger.info("MinIO: bucket '%s' ya existe", bucket)
    except ClientError:
        client.create_bucket(Bucket=bucket)
        logger.info("MinIO: bucket '%s' creado", bucket)

    # Aplicar política pública
    client.put_bucket_policy(Bucket=bucket, Policy=_public_policy(bucket))
    logger.info("MinIO: política pública aplicada a '%s'", bucket)


def _upload_bytes(client, bucket: str, key: str, data: bytes, content_type: str = "image/jpeg") -> None:
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        ContentLength=len(data),
    )


def _delete_object(client, bucket: str, key: str) -> None:
    try:
        client.delete_object(Bucket=bucket, Key=key)
    except ClientError as e:
        logger.warning("MinIO delete error para key '%s': %s", key, e)


# ── API asíncrona pública ──────────────────────────────────────────────────────

async def init_storage() -> None:
    """Inicializa el bucket de MinIO al arrancar la aplicación."""
    s = get_settings()
    loop = asyncio.get_event_loop()
    try:
        client = _make_client()
        await loop.run_in_executor(None, partial(_ensure_bucket, client, s.MINIO_BUCKET))
    except Exception as exc:
        logger.error("MinIO init falló (¿está corriendo el contenedor?): %s", exc)


async def upload_product_image(product_id: str, file_bytes: bytes) -> str:
    """
    Procesa y sube una imagen de producto a MinIO.

    Returns:
        URL pública relativa, p.ej.  /media/products/{product_id}/{uuid}.jpg
    """
    s      = get_settings()
    loop   = asyncio.get_event_loop()
    client = _make_client()

    # 1. Recortar a 1:1 y redimensionar a 800×800
    processed = await loop.run_in_executor(None, partial(_process_image, file_bytes))

    # 2. Generar clave única en MinIO
    object_key = f"products/{product_id}/{uuid.uuid4().hex}.jpg"

    # 3. Subir a MinIO
    await loop.run_in_executor(None, partial(_upload_bytes, client, s.MINIO_BUCKET, object_key, processed))

    # 4. Devolver URL pública relativa
    return f"{s.MINIO_PUBLIC_BASE}/{object_key}"


async def delete_product_image(public_url: str) -> None:
    """Elimina una imagen de MinIO dado su URL pública relativa."""
    s = get_settings()
    # /media/products/... → products/...
    prefix = f"{s.MINIO_PUBLIC_BASE}/"
    if public_url.startswith(prefix):
        object_key = public_url[len(prefix):]
        loop   = asyncio.get_event_loop()
        client = _make_client()
        await loop.run_in_executor(None, partial(_delete_object, client, s.MINIO_BUCKET, object_key))
