import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Numeric, Text, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

if TYPE_CHECKING:
    from app.models.product import Product


class OrderStatusEnum(str, enum.Enum):
    pending   = "pending"    # creado, esperando pago
    paid      = "paid"       # pago confirmado
    shipped   = "shipped"    # en camino
    delivered = "delivered"  # entregado
    cancelled = "cancelled"  # cancelado


class Order(Base):
    """Cabecera de pedido — un registro por compra."""
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,   # nullable para no perder historial si se borra el usuario
        index=True,
    )
    status: Mapped[OrderStatusEnum] = mapped_column(
        SAEnum(OrderStatusEnum),
        default=OrderStatusEnum.pending,
        nullable=False,
        index=True,
    )
    shipping_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Total calculado al cierre — snapshot para historial exacto
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Order {self.id} status={self.status} total={self.total}>"


class OrderItem(Base):
    """
    Línea de detalle de un pedido.

    unit_price es un SNAPSHOT del precio al momento de la compra —
    aunque el precio del producto cambie después, el historial permanece exacto.
    subtotal = quantity × unit_price (calculado y guardado para historial).
    """
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,   # nullable para no perder ítem si se borra el producto
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)   # snapshot
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)     # qty * unit_price

    # Snapshot del nombre/marca por si el producto se elimina
    product_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="order_items")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="order_items")

    def __repr__(self) -> str:
        return f"<OrderItem order={self.order_id} product={self.product_id} qty={self.quantity}>"
