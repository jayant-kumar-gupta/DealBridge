from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.database import SessionDep
from app.models.database import Product, ProductPriceHistory
from app.schemas.price_history import ProductPriceHistoryRead


router = APIRouter(prefix="/price-history", tags=["Price History"])


@router.get("/{product_id}", response_model=list[ProductPriceHistoryRead])
def read_product_price_history(
    product_id: int,
    session: SessionDep,
) -> list[ProductPriceHistory]:
    if not session.get(Product, product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    statement = (
        select(ProductPriceHistory)
        .where(ProductPriceHistory.product_id == product_id)
        .order_by(ProductPriceHistory.date)
    )
    return list(session.exec(statement).all())