from pydantic import BaseModel, Field
from typing import Optional
import enum


class AvailabilityEnum(str, enum.Enum):
    in_stock = "in-stock"
    low_stock = "low-stock"
    out_of_stock = "out-of-stock"


class PriceBase(BaseModel):
    site: str = Field(min_length=1, max_length=100, description="Nombre de la tienda")
    price: float = Field(gt=0, description="Precio en la moneda indicada (debe ser positivo)")
    currency: str = Field(default="MXN", min_length=3, max_length=3, description="Código ISO 4217 (ej. MXN)")
    availability: AvailabilityEnum = AvailabilityEnum.in_stock
    url: str = Field(default="#", max_length=2048, description="URL del producto en la tienda")
    shipping: Optional[float] = Field(default=None, ge=0, description="Costo de envío (0 = gratis)")


class PriceCreate(PriceBase):
    product_id: str = Field(min_length=1, max_length=50)


class PriceUpdate(BaseModel):
    site: Optional[str] = Field(default=None, min_length=1, max_length=100)
    price: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    availability: Optional[AvailabilityEnum] = None
    url: Optional[str] = Field(default=None, max_length=2048)
    shipping: Optional[float] = Field(default=None, ge=0)


class PriceOut(PriceBase):
    id: str
    product_id: str

    model_config = {"from_attributes": True}
