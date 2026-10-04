from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from app.models.database import User, Order, Address, PartnerPrice, Cart, OrderItem, Product
from app.schemas.orders import OrderCreate, OrderRead
from app.core.utils import get_current_user
import secrets

router = APIRouter(prefix="/orders", tags=["Orders"])

def secret_token():
    return secrets.token_urlsafe(16)

def sync_stock_quantity(session, product_id, partner_id, quantity, action):
    partner_price = session.exec(select(PartnerPrice).where(PartnerPrice.product_id == product_id,PartnerPrice.partner_id == partner_id)).first()

    if not partner_price:
        return

    if action == "Create":
        partner_price.stock_count -= quantity
    else:
        partner_price.stock_count += quantity
    session.add(partner_price)

# Create Order
@router.post("/", response_model=OrderRead)
def create_order(order_detail: OrderCreate, session: SessionDep, current_user: User = Depends(get_current_user)):
    
    # Getting the address Info
    address = session.exec(select(Address).where(Address.user_id == current_user.id, Address.isdefault == True)).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = "Please configure a delivery address before checkout.")

    # Getting the cart items
    cart_items = session.exec(select(Cart).where(Cart.user_id == current_user.id)).all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items in cart")
    
    order = Order(
        user_id=current_user.id,
        address_id=address.id,
        amount_paid=order_detail.amount_paid,
        promocode=secret_token(),
    )

    session.add(order)
    session.flush() # Generates order id

    # Checking the payment
    required_amount = 0.0
    for item in cart_items:
        product = item.product
        required_amount += round(item.quantity * product.our_deal, 2)
    if required_amount != order_detail.amount_paid:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Payment Not Validated!")

    # Adding Order Items
    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            partner_id=item.partner_id,
            quantity=item.quantity,
            price=item.product.our_deal,
        )
        session.add(order_item)
        session.flush()

        # Decreasing the stock when order is successfull
        sync_stock_quantity(session, order_item.product_id, order_item.partner_id, order_item.quantity, action="Create")

        # clearing cart when order is created
        session.delete(item)
    session.commit()
    session.refresh(order)

    return {"order_detail": order, "address": address, "order_items": order.items}

# Read Order
@router.get("/")
def read_orders(session: SessionDep, current_user: User = Depends(get_current_user)):
    orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()

    if not orders:
        return []

    response = []
    for order in orders:
        address = session.exec(select(Address).where(Address.user_id == current_user.id, Address.id == order.address_id)).first()
        item_data = []
        for item in order.items:
            product = session.get(Product, item.product_id)
            item_data.append({
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "partner_id": item.partner_id,
                "price": item.price,
                "product_name": product.name,
                "image_path": product.image_path,
            })
        response.append({"order_detail": order, "address": address, "order_items": item_data})
    
    return response

# Read Order By Order ID
@router.get("/{id}")
def read_order_by_id(id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    order = session.exec(select(Order).where(Order.user_id == current_user.id, Order.id == id)).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order detail not found!")
    
    address = session.get(Address, order.address_id)

    item_data = []
    for item in order.items:
        product = session.get(Product, item.product_id)
        item_data.append({
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "partner_id": item.partner_id,
            "price": item.price,
            "product_name": product.name,
            "image_path": product.image_path,
        })
    
    return {"order_detail": order, "address": address, "order_items": item_data}

# Update method for order? How is a user allowed to update the order once order is done? That's why not implemented.

# Delete/Cancel Order
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    order = session.exec(select(Order).where(Order.user_id == current_user.id, Order.id == order_id)).first()
    if not order: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found!")

    for item in order.items:
        sync_stock_quantity(session, item.product_id, item.partner_id, item.quantity, action="Delete")
        
    session.delete(order)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)