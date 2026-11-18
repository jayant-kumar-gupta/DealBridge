from pydantic import BaseModel, Field


class CartRead(BaseModel):
    user_id: int
    product_id: int
    quantity: int
    partner_id: int


class CartItemRead(BaseModel):
    user_id: int
    product_id: int
    quantity: int
    partner_id: int
    name: str | None = None
    brand: str | None = None
    image_path: str | None = None
    price: float | None = None
    original_price: float | None = None
    savings: float | None = None
    partner_name: str | None = None
    partner_color: str | None = None


class CartCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=100)
    partner_id: int | None = None


class CartUpdate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)
    partner_id: int | None = None
