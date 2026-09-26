from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from app.models.database import Cart, User
from app.schemas.carts import CartRead, CartCreate
from app.core.utils import get_current_user

router = APIRouter(prefix="/carts", tags=["Carts"])

# Creating Cart
@router.post("/", response_model=CartRead)
def create_cart(cart_detail: CartCreate, session: SessionDep, current_user: User = Depends(get_current_user)) -> Cart:
    cart = session.get(Cart, (current_user.id, cart_detail.product_id))
    if cart:
        cart.quantity += cart_detail.quantity
    else:
        cart = Cart(
            user_id=current_user.id,
            **cart_detail.model_dump(),
        )

    session.add(cart)
    session.commit()
    session.refresh(cart)
    return cart

# Reading Cart
@router.get("/", response_model=List[CartRead])
def read_cart(session: SessionDep, current_user: User = Depends(get_current_user)) -> List[Cart]:
    products = session.exec(select(Cart).where(Cart.user_id == current_user.id)).all()

    if not products:
        return []

    return list(products)

# Update Cart
@router.put("/", response_model=CartRead)
def update_cart(cart_detail: CartCreate, session: SessionDep, current_user: User = Depends(get_current_user)) -> Cart:

    existing = session.get(Cart, (current_user.id, cart_detail.product_id))
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Cart detail found!")
    
    existing.user_id = current_user.id
    existing.product_id = cart_detail.product_id
    existing.quantity = cart_detail.quantity
    existing.partner_id = cart_detail.partner_id

    session.add(existing)
    session.commit()
    session.refresh(existing)
    return existing

# Delete Cart
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart(product_id: int, session: SessionDep, current_user: User = Depends(get_current_user)):

    cart = session.get(Cart, (current_user.id, product_id))

    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Cart detail found!")

    session.delete(cart)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)