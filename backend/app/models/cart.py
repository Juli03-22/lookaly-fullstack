import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class CartStatusEnum(str, enum.Enum):
    open      = "open"      # activo, el usuario lo está usando
    closed    = "closed"    # convertido en pedido (checkout completado)
    expired   = "expired"   # expiró sin checkout (> 24h sin actividad)


class Cart(Base):
    """
    Sesión de carrito independiente del usuario.
    Permite múltiples carritos históricos por usuario; solo uno puede estar 'open'.
    Los CartItems del flujo actual siguen usando user_id para no romper el router.
    Esta tabla se usará en la Fase 2 (checkout).
    """
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[CartStatusEnum] = mapped_column(
        SAEnum(CartStatusEnum),
        default=CartStatusEnum.open,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Cart user={self.user_id} status={self.status}>"


class CartItem(Base):
    """
    Item dentro del carrito de un usuario.
    Usa user_id directamente (diseño actual) — en Fase 2 se migrará a cart_id.
    """
    __tablename__ = "cart_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    selected_site: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="cart_items")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CartItem user={self.user_id} product={self.product_id} qty={self.quantity}>"
