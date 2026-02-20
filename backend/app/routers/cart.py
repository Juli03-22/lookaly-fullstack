from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.cart import CartItem
from app.models.price import Price
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemOut, CartOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

FREE_SHIPPING_THRESHOLD = 2500.0
SHIPPING_COST = 150.0


def _calculate_cart(items: list[CartItem]) -> CartOut:
    cart_items_out = []
    subtotal = 0.0

    for item in items:
        price_entry = next(
            (p for p in item.product.prices if p.site == item.selected_site),
            item.product.prices[0] if item.product.prices else None,
        )
        item_price = price_entry.price if price_entry else 0.0
        subtotal += item_price * item.quantity
        cart_items_out.append(item)

    shipping = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else (SHIPPING_COST if subtotal > 0 else 0.0)

    return CartOut(
        items=cart_items_out,
        total_items=sum(i.quantity for i in items),
        subtotal=subtotal,
        shipping=shipping,
        total=subtotal + shipping,
    )


@router.get("", response_model=CartOut)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product).selectinload("prices"))
        .where(CartItem.user_id == current_user.id)
    )
    items = result.scalars().all()
    return _calculate_cart(items)


@router.post("/items", response_model=CartItemOut, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Si ya existe en carrito, incrementar cantidad
    result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == data.product_id,
            CartItem.selected_site == data.selected_site,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.quantity += data.quantity
        await db.flush()
        await db.refresh(existing)
        return existing

    item = CartItem(user_id=current_user.id, **data.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=CartItemOut)
async def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")

    if data.quantity < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")

    item.quantity = data.quantity
    if data.selected_site:
        item.selected_site = data.selected_site
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cart_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")
    await db.delete(item)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    items = result.scalars().all()
    for item in items:
        await db.delete(item)
