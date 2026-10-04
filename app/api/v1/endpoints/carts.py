from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from app.models.database import Cart, User, Product, Partner, PartnerPrice
from app.schemas.carts import CartRead, CartCreate, CartItemRead, CartUpdate
from app.core.utils import get_current_user

router = APIRouter(prefix="/carts", tags=["Carts"])

def _build_cart_item_response(cart: Cart, session = None) -> CartItemRead:
    p = cart.product
    if p is None and session is not None and cart.product_id:
        p = session.get(Product, cart.product_id)
    pt = cart.partner
    if pt is None and session is not None and cart.partner_id:
        pt = session.get(Partner, cart.partner_id)

    price = p.our_deal if p else 0
    original_price = round(price * 50 / 49, 2) if price else 0
    savings = round(original_price - price, 2) if price else 0

    return CartItemRead(
        user_id=cart.user_id,
        product_id=cart.product_id,
        quantity=cart.quantity,
        partner_id=cart.partner_id,
        name=p.name if p else None,
        brand=p.brand if p else None,
        image_path=p.image_path if p else None,
        price=price,
        original_price=original_price,
        savings=savings,
        partner_name=pt.name if pt else None,
        partner_color=pt.badge_color if pt else None,
    )

# Creating / Adding to Cart
@router.post("/", response_model=CartItemRead)
def create_cart(cart_detail: CartCreate, session: SessionDep, current_user: User = Depends(get_current_user)) -> CartItemRead:
    product = session.get(Product, cart_detail.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Determine partner_id: lowest price partner if not specified
    if not cart_detail.partner_id:
        cheapest_partner = session.exec(
            select(PartnerPrice)
            .where(PartnerPrice.product_id == cart_detail.product_id)
            .order_by(PartnerPrice.partner_price.asc())
        ).first()

        if cheapest_partner:
            partner_id = cheapest_partner.partner_id
        else:
            first_partner = session.exec(select(Partner)).first()
            partner_id = first_partner.id if first_partner else 1
    else:
        partner_id = cart_detail.partner_id

    cart = session.get(Cart, (current_user.id, cart_detail.product_id))
    if cart:
        cart.quantity += cart_detail.quantity
        if cart_detail.partner_id:
            cart.partner_id = partner_id
    else:
        cart = Cart(
            user_id=current_user.id,
            product_id=cart_detail.product_id,
            quantity=cart_detail.quantity,
            partner_id=partner_id,
        )

    session.add(cart)
    session.commit()
    session.refresh(cart)
    return _build_cart_item_response(cart, session)

# Reading Cart
@router.get("/", response_model=List[CartItemRead])
def read_cart(session: SessionDep, current_user: User = Depends(get_current_user)) -> List[CartItemRead]:
    cart_items = session.exec(select(Cart).where(Cart.user_id == current_user.id)).all()
    return [_build_cart_item_response(item, session) for item in cart_items]

# Update Cart
@router.put("/", response_model=CartItemRead)
def update_cart(cart_detail: CartUpdate, session: SessionDep, current_user: User = Depends(get_current_user)) -> CartItemRead:
    existing = session.get(Cart, (current_user.id, cart_detail.product_id))
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found!")

    existing.quantity = cart_detail.quantity
    if cart_detail.partner_id:
        existing.partner_id = cart_detail.partner_id

    session.add(existing)
    session.commit()
    session.refresh(existing)
    return _build_cart_item_response(existing, session)

# Delete single product from Cart
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart(product_id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    cart = session.get(Cart, (current_user.id, product_id))
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found!")

    session.delete(cart)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)