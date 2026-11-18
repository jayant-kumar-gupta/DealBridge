import secrets
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import select
from app.core.database import SessionDep
from app.core.utils import get_current_user, require_admin
from app.models.database import Address, Cart, Order, OrderItem, PartnerPrice, Product, User
from app.schemas.orders import OrderCreate, OrderRead, OrderStatusUpdate
from app.services.order_service import (
    ALLOWED_ORDER_STATUSES,
    adjust_stock,
    build_order_response,
    fetch_orders_query,
    load_orders_with_details,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def secret_token() -> str:
    return secrets.token_urlsafe(16)


# Create Order
@router.post("/", response_model=OrderRead)
def create_order(
    order_detail: OrderCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    # Getting the address Info
    address = session.exec(
        select(Address).where(Address.user_id == current_user.id, Address.isdefault == True)
    ).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please configure a delivery address before checkout.",
        )

    # Getting the cart items
    cart_items = session.exec(select(Cart).where(Cart.user_id == current_user.id)).all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items in cart")

    # 1. Compute exact required amount using each item's selected partner price
    required_amount = 0.0
    resolved_items: list[tuple[Cart, Product, float]] = []
    products_by_id: dict[int, Product] = {}

    for item in cart_items:
        p = item.product or session.get(Product, item.product_id)
        if not p:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found",
            )
        products_by_id[p.id] = p

        partner_offer = session.get(PartnerPrice, (item.product_id, item.partner_id))
        if partner_offer is not None:
            unit_price = float(partner_offer.partner_price)
        elif p.our_deal is not None:
            unit_price = float(p.our_deal)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{p.name}' does not have an active partner price.",
            )

        required_amount += item.quantity * unit_price
        resolved_items.append((item, p, unit_price))

    required_amount = round(required_amount, 2)
    amount_paid = (
        round(float(order_detail.amount_paid), 2)
        if order_detail.amount_paid is not None
        else required_amount
    )

    # Validate payment with a 0.05 float tolerance to account for floating-point rounding
    if abs(required_amount - amount_paid) > 0.05:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Payment Not Validated! Required: ₹{required_amount:.2f}, Received: ₹{amount_paid:.2f}",
        )

    # 2. Create the order and validate/decrement stock atomically
    order = Order(
        user_id=current_user.id,
        address_id=address.id,
        amount_paid=required_amount,
        promocode=secret_token(),
        status="Active",
    )

    session.add(order)
    session.flush()  # Generates order id

    for item, _product, unit_price in resolved_items:
        # Validate & decrement stock before finalizing
        adjust_stock(session, item.product_id, item.partner_id, item.quantity, action="Create")

        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            partner_id=item.partner_id,
            quantity=item.quantity,
            price=unit_price,
        )
        session.add(order_item)
        session.delete(item)

    session.commit()
    session.refresh(order)

    return build_order_response(order, address, products_by_id)


# Read Orders
@router.get("/")
def read_orders(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    stmt = fetch_orders_query(None if current_user.is_admin else current_user.id)
    orders = list(session.exec(stmt).all())
    return load_orders_with_details(session, orders)


# Read Order By Order ID
@router.get("/{id}")
def read_order_by_id(
    id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    stmt = fetch_orders_query(None if current_user.is_admin else current_user.id).where(Order.id == id)
    order = session.exec(stmt).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order detail not found!")

    return load_orders_with_details(session, [order])[0]


# Update Order Status (Admin only)
@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    session: SessionDep,
    current_admin: User = Depends(require_admin),
):
    order = session.exec(fetch_orders_query().where(Order.id == order_id)).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found!")

    new_status = status_update.status
    if new_status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {sorted(ALLOWED_ORDER_STATUSES)}",
        )

    old_status = order.status or "Active"
    if old_status == new_status:
        return load_orders_with_details(session, [order])[0]

    if old_status == "Cancelled" and new_status != "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled orders cannot be reopened.",
        )

    if old_status != "Cancelled" and new_status == "Cancelled":
        for item in order.items:
            adjust_stock(session, item.product_id, item.partner_id, item.quantity, action="Cancel")

    order.status = new_status
    session.add(order)
    session.commit()
    session.refresh(order)

    return load_orders_with_details(session, [order])[0]


# Soft-Cancel Order
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    stmt = fetch_orders_query(None if current_user.is_admin else current_user.id).where(
        Order.id == order_id
    )
    order = session.exec(stmt).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found!")

    if (order.status or "").lower() == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled.",
        )
    if (order.status or "").lower() == "delivered":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivered orders cannot be cancelled.",
        )

    for item in order.items:
        adjust_stock(session, item.product_id, item.partner_id, item.quantity, action="Cancel")

    order.status = "Cancelled"
    session.add(order)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
