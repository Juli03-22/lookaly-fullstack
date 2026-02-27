import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Float, Integer, Numeric, Boolean, Enum as SAEnum, DateTime
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
    subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Imagen legacy (columna original) — se mantiene para retrocompatibilidad.
    # Las fotos reales viven en product_images; esta se usa como fallback.
    image: Mapped[str] = mapped_column(String(512), nullable=False, default="")

    # Precio base / precio Lookaly.mx (distinto a price_comparisons)
    unit_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)

    # Inventario
    stock: Mapped[int] = mapped_column(Integer, default=0)
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True, index=True)
    weight_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # gramos, para cálculo de envío
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Rating — se mantiene para compatibilidad con el seed CSV y frontend actual
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    reviews: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prices: Mapped[list["Price"]] = relationship("Price", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    images: Mapped[list["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order", lazy="selectin")
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")

    @property
    def primary_image(self) -> str:
        """Devuelve la URL de la imagen principal, con fallback a la columna legacy."""
        for img in self.images:
            if img.is_primary:
                return img.url
        if self.images:
            return self.images[0].url
        return self.image

    def __repr__(self) -> str:
        return f"<Product {self.name} ({self.brand})>"
