from pydantic import BaseModel, Field, field_validator
from typing import Optional
from .price import PriceOut
import enum


class CategoryEnum(str, enum.Enum):
    maquillaje = "maquillaje"
    cuerpo = "cuerpo"
    piel = "piel"


class ProductImageOut(BaseModel):
    id: str
    url: str
    is_primary: bool
    sort_order: int
    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    brand: str = Field(min_length=1, max_length=100)
    category: CategoryEnum
    subcategory: Optional[str] = Field(default=None, max_length=100)
    description: str = Field(min_length=10, max_length=2000)
    # Imagen legacy (fallback); las fotos reales van en product_images
    image: str = Field(default="", max_length=512)
    unit_price: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(default=0, ge=0)
    sku: Optional[str] = Field(default=None, max_length=100)
    weight_g: Optional[int] = Field(default=None, ge=0)
    is_active: bool = Field(default=True)
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    reviews: int = Field(default=0, ge=0)

    @field_validator("name", "brand", "description", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[CategoryEnum] = None
    subcategory: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, min_length=10, max_length=2000)
    image: Optional[str] = Field(default=None, max_length=512)
    unit_price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    sku: Optional[str] = Field(default=None, max_length=100)
    weight_g: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    reviews: Optional[int] = Field(default=None, ge=0)


class ProductOut(ProductBase):
    id: str
    prices: list[PriceOut] = []
    images: list[ProductImageOut] = []
    primary_image: Optional[str] = None  # calculado por el modelo

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    size: int
    pages: int
