from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field
from ..schemas import addresses


class OrderReadBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    promocode: str
    amount_paid: float
    date: datetime
    status: str


class OrderCreate(BaseModel):
    amount_paid: float = Field(ge=0)


class OrderStatusUpdate(BaseModel):
    status: Literal["Active", "Delivered", "Cancelled"]


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: int
    quantity: int
    partner_id: int
    price: float
    product_name: str | None = None
    image_path: str | None = None


class OrderRead(BaseModel):
    order_detail: OrderReadBase
    address: addresses.AddressRead | None = None
    order_items: List[OrderItemRead]
