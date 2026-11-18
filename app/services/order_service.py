from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select
from app.models.database import Address, Order, OrderItem, PartnerPrice, Product


ALLOWED_ORDER_STATUSES = {"Active", "Delivered", "Cancelled"}


def adjust_stock(
    session: Session,
    product_id: int,
    partner_id: int,
    quantity: int,
    action: str,
) -> None:
    """Atomically validate and adjust partner stock for an order item."""
    stmt = (
        select(PartnerPrice)
        .where(
            PartnerPrice.product_id == product_id,
            PartnerPrice.partner_id == partner_id,
        )
        .with_for_update()
    )
    partner_price = session.exec(stmt).first()

    if action == "Create":
        if not partner_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Partner offer not found for product #{product_id} and partner #{partner_id}.",
            )
        available = partner_price.stock_count or 0
        if available < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product #{product_id} (available: {available}, requested: {quantity}).",
            )
        partner_price.stock_count = available - quantity
        session.add(partner_price)
    elif action == "Cancel":
        if partner_price:
            partner_price.stock_count = (partner_price.stock_count or 0) + quantity
            session.add(partner_price)


def build_order_response(
    order: Order,
    address: Address | None,
    products_by_id: dict[int, Product],
) -> dict:
    item_data = []
    for item in order.items:
        product = products_by_id.get(item.product_id)
        item_data.append(
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "partner_id": item.partner_id,
                "price": item.price,
                "product_name": product.name if product else f"Product #{item.product_id}",
                "image_path": product.image_path if product else None,
            }
        )
    return {
        "order_detail": order,
        "address": address,
        "order_items": item_data,
    }


def load_orders_with_details(session: Session, orders: list[Order]) -> list[dict]:
    """Batch-load addresses and products for a list of orders to avoid N+1 queries."""
    if not orders:
        return []

    address_ids = {o.address_id for o in orders if o.address_id is not None}
    product_ids = {item.product_id for o in orders for item in o.items}

    addresses_by_id: dict[int, Address] = {}
    if address_ids:
        addresses = session.exec(select(Address).where(Address.id.in_(address_ids))).all()
        addresses_by_id = {a.id: a for a in addresses if a.id is not None}

    products_by_id: dict[int, Product] = {}
    if product_ids:
        products = session.exec(select(Product).where(Product.id.in_(product_ids))).all()
        products_by_id = {p.id: p for p in products if p.id is not None}

    return [
        build_order_response(order, addresses_by_id.get(order.address_id), products_by_id)
        for order in orders
    ]


def fetch_orders_query(user_id: int | None = None):
    stmt = select(Order).options(selectinload(Order.items))
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    return stmt
