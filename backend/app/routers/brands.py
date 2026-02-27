from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandOut
from app.core.security import get_current_admin, require_role

_can_manage = require_role('gestor_inventario')

router = APIRouter()


@router.get("", response_model=list[BrandOut])
async def list_brands(db: AsyncSession = Depends(get_db)):
    """Lista todas las marcas ordenadas alfabéticamente. Pública."""
    result = await db.execute(select(Brand).order_by(Brand.name))
    return result.scalars().all()


@router.post("", response_model=BrandOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(_can_manage)])
async def create_brand(
    data: BrandCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea una nueva marca. Solo administradores."""
    existing = (await db.execute(
        select(Brand).where(Brand.name.ilike(data.name.strip()))
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="La marca ya existe")
    brand = Brand(name=data.name.strip())
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(_can_manage)])
async def delete_brand(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Elimina una marca. Administrador o gestor de inventario."""
    brand = await db.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    await db.delete(brand)
    await db.commit()
