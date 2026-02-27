import uuid
from datetime import datetime
from sqlalchemy import String, Float, Numeric, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class AvailabilityEnum(str, enum.Enum):
    in_stock = "in-stock"
    low_stock = "low-stock"
    out_of_stock = "out-of-stock"


class Price(Base):
    """
    Comparador de precios entre tiendas (price_comparisons conceptualmente).
    Mantiene el nombre 'prices' en la DB para no romper el schema actual.
    """
    __tablename__ = "prices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    site: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="MXN")
    availability: Mapped[AvailabilityEnum] = mapped_column(SAEnum(AvailabilityEnum), default=AvailabilityEnum.in_stock)
    url: Mapped[str] = mapped_column(String(512), nullable=False, default="#")
    shipping: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="prices")

    def __repr__(self) -> str:
        return f"<Price {self.site}: {self.price} {self.currency}>"
