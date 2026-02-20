import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class CategoryEnum(str, enum.Enum):
    maquillaje = "maquillaje"
    cuerpo = "cuerpo"
    piel = "piel"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[CategoryEnum] = mapped_column(SAEnum(CategoryEnum), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(512), nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    reviews: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prices: Mapped[list["Price"]] = relationship("Price", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product {self.name} ({self.brand})>"
