from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from datetime import datetime, timezone
from app.models.database import User, PartnerPrice, Product, Partner, ProductPriceHistory
from app.api.v1.endpoints.user_auth import require_admin

router = APIRouter(prefix="/partner-prices", tags=["Partner Price"])

def sync_product_table(session, product_id: int):
    product = session.get(Product, product_id)

    if not product: 
        return

    cheapest_price = session.exec(select(PartnerPrice)
                                  .where(PartnerPrice.product_id == product.id)
                                  .order_by(PartnerPrice.partner_price.asc())
                                  ).first()

    if not cheapest_price:
        product.our_deal = None
        product.marked_price = None
    else:
        product.our_deal = cheapest_price.partner_price
        product.marked_price = cheapest_price.marked_price

        session.add(
            ProductPriceHistory(
                partner_id=cheapest_price.partner_id,
                product_id=product_id,
                date=datetime.now(timezone.utc),
                price=cheapest_price.partner_price,
            )
        )
    session.add(product)

# Create Partner_Price
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PartnerPrice)
def create_price(detail: PartnerPrice, session: SessionDep, current_user: User = Depends(require_admin)) -> PartnerPrice:
    # Adding Price for a product means the "our_deal" column in product table should/might be changed.

    if detail.product_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id is required")
    if detail.partner_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="partner_id is required")

    product = session.get(Product, detail.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    partner = session.get(Partner, detail.partner_id)
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    existing_price = session.get(PartnerPrice, (detail.product_id, detail.partner_id))
    if existing_price:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Price record already exists for product id {detail.product_id} and partner id {detail.partner_id}. Use PUT to update."
        )

    session.add(detail)
    session.flush() # Make the new price visible in the current transaction

    sync_product_table(session, detail.product_id)

    session.commit()
    session.refresh(detail)
    return detail

# Read Partner Price
@router.get("/", response_model=List[PartnerPrice])
def get_price(session: SessionDep) -> List[PartnerPrice]:
    prices = session.exec(select(PartnerPrice)).all()
    return list(prices)

# Read Partner Price By Product ID
@router.get("/{id}", response_model=List[PartnerPrice])
def get_price_by_product_id(session: SessionDep, id: int) -> List[PartnerPrice]:
    prices = session.exec(select(PartnerPrice).where(PartnerPrice.product_id == id)).all()
    return list(prices)

# Read Partner Price By Partner ID
@router.get("/partner-{id}", response_model=List[PartnerPrice])
def get_price_by_partner_id(session: SessionDep, id: int) -> List[PartnerPrice]:
    prices = session.exec(select(PartnerPrice).where(PartnerPrice.partner_id == id)).all()
    return list(prices)

# Delete Partner Price
@router.delete("/{product_id}-{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price(session: SessionDep, product_id: int, partner_id: int, current_user: User = Depends(require_admin)):
    price = session.get(PartnerPrice, (product_id, partner_id))
    if not price:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No prices record for product id: {product_id} from partner id: {partner_id}")

    session.delete(price)
    session.flush()
    sync_product_table(session, product_id)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Updating Partner price
@router.put("/{product_id}-{partner_id}", response_model=PartnerPrice)
def update_price(detail: PartnerPrice, session: SessionDep, product_id: int, partner_id: int, current_user: User = Depends(require_admin)) -> PartnerPrice:
    price = session.get(PartnerPrice, (product_id, partner_id))
    if not price:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No prices record for product id: {product_id} from partner id: {partner_id}")
    if detail.product_id is None or detail.partner_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id and partner_id are required")

    if detail.product_id != product_id:
        if not session.get(Product, detail.product_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced product not found")
    if detail.partner_id != partner_id:
        if not session.get(Partner, detail.partner_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced partner not found")

    price.partner_id = detail.partner_id
    price.product_id = detail.product_id
    price.partner_price = detail.partner_price
    price.marked_price = detail.marked_price
    price.stock_count = detail.stock_count
    price.partner_product_url = detail.partner_product_url
    price.date = datetime.now(timezone.utc)

    session.add(price)
    session.flush()
    sync_product_table(session, product_id)
    if detail.product_id != product_id:
        sync_product_table(session, detail.product_id)
    session.commit()
    session.refresh(price)

    return price