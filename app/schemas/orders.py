from pydantic import BaseModel
from datetime import datetime
from ..schemas import addresses
from ..models.database import OrderItem
from typing import List

class OrderReadBase(BaseModel):
    id: int
    user_id: int
    promocode: str
    amount_paid: float
    date: datetime
    status: str

class OrderCreate(BaseModel):
    amount_paid: float

class OrderRead(BaseModel):
    order_detail: OrderReadBase
    address: addresses.AddressRead | None = None
    order_items: List[OrderItem]