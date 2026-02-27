from pydantic import BaseModel, Field
from typing import Optional


class ProductImageCreate(BaseModel):
    url: str = Field(max_length=512)
    is_primary: bool = False
    sort_order: int = Field(default=0, ge=0)


class ProductImageUpdate(BaseModel):
    url: Optional[str] = Field(default=None, max_length=512)
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = Field(default=None, ge=0)


class ProductImageOut(BaseModel):
    id: str
    product_id: str
    url: str
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}
