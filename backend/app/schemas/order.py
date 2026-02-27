from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import enum


class OrderStatusEnum(str, enum.Enum):
    pending   = "pending"
    paid      = "paid"
    shipped   = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=100)
    unit_price: float = Field(ge=0)


class OrderItemOut(BaseModel):
    id: str
    product_id: Optional[str]
    product_name: Optional[str]
    product_brand: Optional[str]
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    shipping_address: Optional[str] = None
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderUpdate(BaseModel):
    status: Optional[OrderStatusEnum] = None
    shipping_address: Optional[str] = None
    paid_at: Optional[datetime] = None


class OrderOut(BaseModel):
    id: str
    user_id: Optional[str]
    status: OrderStatusEnum
    shipping_address: Optional[str]
    total: float
    order_items: list[OrderItemOut] = []
    created_at: datetime
    paid_at: Optional[datetime]
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListOut(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    size: int
    pages: int
