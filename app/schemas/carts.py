from pydantic import BaseModel

class CartRead(BaseModel):
    user_id: int
    product_id: int
    quantity: int
    partner_id: int

class CartCreate(BaseModel):
    product_id: int
    quantity: int
    partner_id: int