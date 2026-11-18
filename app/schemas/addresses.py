from pydantic import BaseModel

class AddressCreate(BaseModel):
    address_line1: str
    address_line2: str | None = None
    city: str
    state: str
    pincode: int
    type: str = "Home"
    isdefault: bool = False

class AddressRead(AddressCreate):
    id: int