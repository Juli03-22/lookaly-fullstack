import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.product import Product


class ProductImage(Base):
    """
    Tabla de imágenes de producto (N:1 con products).

    Permite múltiples fotos por producto con orden configurable.
    La imagen marcada como is_primary=True es la que se muestra en tarjetas y listados.
    Las demás aparecen en la galería del detalle de producto.

    Columna `url`:
      - URL externa: https://example.com/foto.jpg
      - Foto local:  /static/images/products/nombre.jpg
    """
    __tablename__ = "product_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="images")

    def __repr__(self) -> str:
        return f"<ProductImage product={self.product_id} primary={self.is_primary}>"
