"""Router de productos.

3.3 – Protección contra inyección SQL
────────────────────────────────────────────────────
Todas las consultas usan el ORM de SQLAlchemy (Core + Expression Language).
SQLAlchemy genera SIEMPRE consultas parametrizadas:

    Código:  Product.name.ilike(f"%{search}%")
    SQL generado:  WHERE name ILIKE $1   → parámetro: '%foo%'

La variable `search` NUNCA se interpola directamente en SQL —
el driver asyncpg envía el parámetro por separado (binding),
imposibilitando un ataque de inyección SQL.

Se evita deliberadamente:
  • text() con concatenación de strings
  • execute(f"SELECT ... WHERE name = '{user_input}'")
  • Cualquier consulta construida con formato directo de strings
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.product import Product, CategoryEnum
from app.models.price import Price
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductListOut
from app.core.security import get_current_admin

router = APIRouter()


@router.get("", response_model=ProductListOut)
async def list_products(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: CategoryEnum | None = None,
    brand: str | None = None,
    search: str | None = None,
    sort: str = Query("rating", enum=["rating", "price_asc", "price_desc", "name"]),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).options(selectinload(Product.prices))

    if category:
        query = query.where(Product.category == category)
    if brand:
        query = query.where(Product.brand.ilike(f"%{brand}%"))
    if search:
        query = query.where(
            Product.name.ilike(f"%{search}%") | Product.brand.ilike(f"%{search}%")
        )

    # Total count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Sort
    if sort == "name":
        query = query.order_by(Product.name)
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())

    # Paginación
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    products = result.scalars().all()

    # Sort por precio mínimo si aplica (post-query)
    if sort in ("price_asc", "price_desc"):
        products = sorted(
            products,
            key=lambda p: min((pr.price for pr in p.prices), default=0),
            reverse=(sort == "price_desc"),
        )

    return ProductListOut(
        items=products,
        total=total,
        page=page,
        size=size,
        pages=max(1, -(-total // size)),  # ceil division
    )


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).options(selectinload(Product.prices)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_admin)])
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    # Reload with relationships
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut,
              dependencies=[Depends(get_current_admin)])
async def update_product(product_id: str, data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).options(selectinload(Product.prices)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(get_current_admin)])
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await db.delete(product)
