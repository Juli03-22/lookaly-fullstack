import uuid
from sqlalchemy import String, Float, Integer, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class AvailabilityEnum(str, enum.Enum):
    in_stock = "in-stock"
    low_stock = "low-stock"
    out_of_stock = "out-of-stock"


class Price(Base):
    __tablename__ = "prices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    site: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="MXN")
    availability: Mapped[AvailabilityEnum] = mapped_column(SAEnum(AvailabilityEnum), default=AvailabilityEnum.in_stock)
    url: Mapped[str] = mapped_column(String(512), nullable=False, default="#")
    shipping: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="prices")

    def __repr__(self) -> str:
        return f"<Price {self.site}: {self.price} {self.currency}>"
