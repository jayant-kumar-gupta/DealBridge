from datetime import datetime

from pydantic import BaseModel


class ProductPriceHistoryRead(BaseModel):
    product_id: int
    partner_id: int
    date: datetime
    price: float