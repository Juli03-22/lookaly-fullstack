from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.price import Price
from app.schemas.price import PriceCreate, PriceUpdate, PriceOut
from app.core.security import require_role

_can_manage = require_role('gestor_inventario', 'vendedor')

router = APIRouter()


@router.get("/product/{product_id}", response_model=list[PriceOut])
async def get_prices_for_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Price).where(Price.product_id == product_id).order_by(Price.price))
    return result.scalars().all()


@router.post("", response_model=PriceOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(_can_manage)])
async def create_price(data: PriceCreate, db: AsyncSession = Depends(get_db)):
    import uuid as _uuid
    price = Price(id=str(_uuid.uuid4()), **data.model_dump())
    db.add(price)
    await db.flush()
    await db.refresh(price)
    return price


@router.patch("/{price_id}", response_model=PriceOut,
              dependencies=[Depends(_can_manage)])
async def update_price(price_id: str, data: PriceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Price).where(Price.id == price_id))
    price = result.scalar_one_or_none()
    if not price:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(price, field, value)
    return price


@router.delete("/{price_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(_can_manage)])
async def delete_price(price_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Price).where(Price.id == price_id))
    price = result.scalar_one_or_none()
    if not price:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    await db.delete(price)
