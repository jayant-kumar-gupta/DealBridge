from datetime import datetime, timezone
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import func, select
from app.core.database import SessionDep
from app.core.utils import require_admin
from app.models.database import Partner, PartnerPrice, Product, User
from app.schemas.partners import PartnerPriceCreate, PartnerPriceUpdate
from app.services.price_service import sync_product_table

router = APIRouter(prefix="/partner-prices", tags=["Partner Price"])


# Create Partner_Price
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PartnerPrice)
def create_price(
    detail: PartnerPriceCreate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> PartnerPrice:
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
            detail=f"Price record already exists for product id {detail.product_id} and partner id {detail.partner_id}. Use PUT to update.",
        )

    price_record = PartnerPrice(
        product_id=detail.product_id,
        partner_id=detail.partner_id,
        partner_price=detail.partner_price,
        marked_price=detail.marked_price,
        stock_count=detail.stock_count,
        partner_product_url=detail.partner_product_url,
        date=datetime.now(timezone.utc),
    )

    session.add(price_record)
    session.flush()

    sync_product_table(
        session,
        detail.product_id,
        changed_partner_id=detail.partner_id,
        record_history=True,
    )

    session.commit()
    session.refresh(price_record)
    return price_record


# Read Partner Price (Paginated)
@router.get("/", response_model=List[PartnerPrice])
def get_price(
    session: SessionDep,
    response: Response,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
    product_id: int | None = None,
    partner_id: int | None = None,
) -> List[PartnerPrice]:
    statement = select(PartnerPrice)
    count_stmt = select(func.count()).select_from(PartnerPrice)

    if product_id is not None:
        statement = statement.where(PartnerPrice.product_id == product_id)
        count_stmt = count_stmt.where(PartnerPrice.product_id == product_id)
    if partner_id is not None:
        statement = statement.where(PartnerPrice.partner_id == partner_id)
        count_stmt = count_stmt.where(PartnerPrice.partner_id == partner_id)

    total = session.exec(count_stmt).one()
    response.headers["X-Total-Count"] = str(total)

    prices = session.exec(statement.offset(offset).limit(limit)).all()
    return list(prices)


# Read Partner Price By Partner ID
@router.get("/partner-{id}", response_model=List[PartnerPrice])
def get_price_by_partner_id(
    session: SessionDep,
    id: int,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> List[PartnerPrice]:
    prices = session.exec(
        select(PartnerPrice).where(PartnerPrice.partner_id == id).offset(offset).limit(limit)
    ).all()
    return list(prices)


# Read Partner Price By Product ID
@router.get("/{id}", response_model=List[PartnerPrice])
def get_price_by_product_id(session: SessionDep, id: int) -> List[PartnerPrice]:
    prices = session.exec(select(PartnerPrice).where(PartnerPrice.product_id == id)).all()
    return list(prices)


# Delete Partner Price
@router.delete("/{product_id}-{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price(
    session: SessionDep,
    product_id: int,
    partner_id: int,
    current_user: User = Depends(require_admin),
):
    price = session.get(PartnerPrice, (product_id, partner_id))
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No prices record for product id: {product_id} from partner id: {partner_id}",
        )

    session.delete(price)
    session.flush()
    sync_product_table(session, product_id, record_history=False)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Updating Partner price
@router.put("/{product_id}-{partner_id}", response_model=PartnerPrice)
def update_price(
    detail: PartnerPriceUpdate,
    session: SessionDep,
    product_id: int,
    partner_id: int,
    current_user: User = Depends(require_admin),
) -> PartnerPrice:
    price = session.get(PartnerPrice, (product_id, partner_id))
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No prices record for product id: {product_id} from partner id: {partner_id}",
        )

    if detail.product_id != product_id and not session.get(Product, detail.product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced product not found")
    if detail.partner_id != partner_id and not session.get(Partner, detail.partner_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced partner not found")

    if (detail.product_id != product_id or detail.partner_id != partner_id) and session.get(
        PartnerPrice, (detail.product_id, detail.partner_id)
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Price record already exists for product id {detail.product_id} and partner id {detail.partner_id}.",
        )

    price.partner_id = detail.partner_id
    price.product_id = detail.product_id
    price.partner_price = detail.partner_price
    price.marked_price = detail.marked_price
    price.stock_count = detail.stock_count
    price.partner_product_url = detail.partner_product_url
    price.date = datetime.now(timezone.utc)

    session.add(price)
    session.flush()

    sync_product_table(
        session,
        detail.product_id,
        changed_partner_id=detail.partner_id,
        record_history=True,
    )
    if detail.product_id != product_id:
        sync_product_table(session, product_id, record_history=False)

    session.commit()
    session.refresh(price)
    return price
