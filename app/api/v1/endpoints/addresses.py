from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from app.models.database import User, Address
from app.schemas.addresses import AddressCreate, AddressRead
from app.core.utils import get_current_user

router = APIRouter(prefix="/addresses", tags=["Addresses"])

# Creating Address
@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_address(detail: AddressCreate, session: SessionDep, current_user: User = Depends(get_current_user)):
    if detail.isdefault:
        existing = session.exec(select(Address).where(Address.user_id == current_user.id, Address.isdefault == True)).first()

        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Address already set to default")

    address = Address(
        user_id=current_user.id,
        name= f"{current_user.firstname or ""} {current_user.lastname or ""}",
        phone = current_user.phone,
        address_line1=detail.address_line1,
        address_line2=detail.address_line2,
        city=detail.city,
        state=detail.state,
        pincode=detail.pincode,
        isdefault=detail.isdefault,
    )

    session.add(address)
    session.commit()
    session.refresh(address)

    return address

# Reading Address
@router.get("/", response_model=List[AddressRead])
def read_address(session: SessionDep, current_user: User  = Depends(get_current_user)):
    address = session.exec(select(Address).where(Address.user_id == current_user.id)).all()

    if not address:
        return []

    return list(address)

# Update Address
@router.put("/{id}", response_model=AddressRead)
def update_address(id: int, detail: AddressCreate, session: SessionDep, current_user: User = Depends(get_current_user)):
    address = session.exec(select(Address).where(Address.id == id, Address.user_id == current_user.id)).first()

    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="address not found!")

    address.address_line1 = detail.address_line1
    address.address_line2 = detail.address_line2
    address.state = detail.state
    address.city = detail.city
    address.pincode = detail.pincode
    address.isdefault = detail.isdefault

    session.add(address)
    session.commit()

    return address

# Deleting Address
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    address = session.exec(select(Address).where(Address.id == id, Address.user_id == current_user.id)).first()

    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="address not found!")

    session.delete(address)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)