from pydantic import BaseModel

class AddressCreate(BaseModel):
    address_line1: str
    address_line2: str | None
    city: str
    state: str
    pincode: int
    type: str
    isdefault: bool

class AddressRead(AddressCreate):
    id: int