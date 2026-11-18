from datetime import datetime, timezone
from sqlmodel import Session, select
from app.models.database import PartnerPrice, Product, ProductPriceHistory


def sync_product_table(
    session: Session,
    product_id: int,
    changed_partner_id: int | None = None,
    record_history: bool = True,
) -> None:
    """Recompute product.our_deal and product.marked_price from the cheapest partner offer,
    and optionally record price history for the specific partner whose price changed."""
    product = session.get(Product, product_id)
    if not product:
        return

    cheapest_price = session.exec(
        select(PartnerPrice)
        .where(PartnerPrice.product_id == product.id, PartnerPrice.partner_price > 0)
        .order_by(PartnerPrice.partner_price.asc())
    ).first()

    if not cheapest_price:
        product.our_deal = None
        product.marked_price = None
    else:
        product.our_deal = cheapest_price.partner_price
        product.marked_price = cheapest_price.marked_price

    if record_history and changed_partner_id is not None:
        changed_offer = session.get(PartnerPrice, (product_id, changed_partner_id))
        if changed_offer:
            session.add(
                ProductPriceHistory(
                    partner_id=changed_partner_id,
                    product_id=product_id,
                    date=datetime.now(timezone.utc),
                    price=changed_offer.partner_price,
                )
            )

    session.add(product)
