from pydantic import BaseModel
from .product import ProductOut


class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1
    selected_site: str


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int
    selected_site: str | None = None


class CartItemOut(CartItemBase):
    id: str
    user_id: str
    product: ProductOut

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    items: list[CartItemOut]
    total_items: int
    subtotal: float
    shipping: float
    total: float
