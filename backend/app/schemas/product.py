from pydantic import BaseModel, Field, field_validator, AnyHttpUrl
from typing import Optional
from .price import PriceOut
import enum


class CategoryEnum(str, enum.Enum):
    maquillaje = "maquillaje"
    cuerpo = "cuerpo"
    piel = "piel"


class ProductBase(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=200,
        description="Nombre del producto (2-200 caracteres)",
    )
    brand: str = Field(
        min_length=1,
        max_length=100,
        description="Marca del producto",
    )
    category: CategoryEnum
    description: str = Field(
        min_length=10,
        max_length=2000,
        description="Descripción (10-2000 caracteres)",
    )
    image: str = Field(
        max_length=500,
        description="URL absoluta de la imagen del producto",
    )
    rating: float = Field(
        default=0.0,
        ge=0.0,   # >= 0
        le=5.0,   # <= 5
        description="Calificación 0.0 – 5.0",
    )
    reviews: int = Field(
        default=0,
        ge=0,
        description="Número de reseñas (entero, no negativo)",
    )

    @field_validator("name", "brand", "description", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        """Recorta espacios extremos en todos los campos de texto."""
        return v.strip() if isinstance(v, str) else v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[CategoryEnum] = None
    description: Optional[str] = Field(default=None, min_length=10, max_length=2000)
    image: Optional[str] = Field(default=None, max_length=500)
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    reviews: Optional[int] = Field(default=None, ge=0)


class ProductOut(ProductBase):
    id: str
    prices: list[PriceOut] = []

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    size: int
    pages: int
