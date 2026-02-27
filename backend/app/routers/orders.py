"""
Router de pedidos (orders).

Endpoints de usuario:
  POST  /api/orders          — crear pedido desde el carrito actual
  GET   /api/orders          — listar mis pedidos
  GET   /api/orders/{id}     — detalle de un pedido

Endpoints de admin:
  GET    /api/orders/admin/all        — todos los pedidos
  PATCH  /api/orders/admin/{id}       — cambiar status, marcar pagado, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderListOut
from app.core.security import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter()


async def _get_order_or_404(order_id: str, db: AsyncSession, user_id: str | None = None) -> Order:
    query = select(Order).options(selectinload(Order.order_items)).where(Order.id == order_id)
    if user_id:
        query = query.where(Order.user_id == user_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order


# ── Endpoints de usuario ───────────────────────────────────────────────────────

@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea un pedido con los items indicados.
    Hace snapshot del nombre, marca y precio al momento de la compra.
    """
    if not data.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")

    order_id = str(uuid.uuid4())
    total = 0.0
    order_items = []

    for item_data in data.items:
        # Verificar que el producto existe y está activo
        result = await db.execute(
            select(Product).where(Product.id == item_data.product_id, Product.is_active == True)  # noqa: E712
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Producto '{item_data.product_id}' no encontrado o no disponible",
            )

        subtotal = round(item_data.unit_price * item_data.quantity, 2)
        total += subtotal

        order_items.append(OrderItem(
            id=str(uuid.uuid4()),
            order_id=order_id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            subtotal=subtotal,
            # Snapshots — inmutables aunque el producto cambie
            product_name=product.name,
            product_brand=product.brand,
        ))

    order = Order(
        id=order_id,
        user_id=current_user.id,
        shipping_address=data.shipping_address,
        total=round(total, 2),
    )
    db.add(order)
    for oi in order_items:
        db.add(oi)

    await db.flush()
    await db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
async def my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista los pedidos del usuario autenticado."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.order_items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de un pedido propio."""
    return await _get_order_or_404(order_id, db, user_id=current_user.id)


# ── Endpoints de admin ─────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=OrderListOut)
async def admin_list_orders(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_admin),
):
    """Lista todos los pedidos (admin). Soporta filtro por status."""
    query = select(Order).options(selectinload(Order.order_items))
    if status_filter:
        query = query.where(Order.status == status_filter)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    query = query.order_by(Order.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    orders = result.scalars().all()

    pages = (total + size - 1) // size
    return OrderListOut(items=orders, total=total, page=page, size=size, pages=pages)


@router.patch("/admin/{order_id}", response_model=OrderOut)
async def admin_update_order(
    order_id: str,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_admin),
):
    """Actualiza status, dirección o fecha de pago de un pedido. Solo admin."""
    order = await _get_order_or_404(order_id, db)

    if data.status is not None:
        order.status = data.status
        # Auto-poner paid_at si cambia a 'paid' y no tiene fecha
        if data.status.value == "paid" and not order.paid_at:
            order.paid_at = datetime.utcnow()

    if data.shipping_address is not None:
        order.shipping_address = data.shipping_address

    if data.paid_at is not None:
        order.paid_at = data.paid_at

    order.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(order)
    return order
