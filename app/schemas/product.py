from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List
from app.schemas.tag import TagRead
from app.schemas.price_history import ProductPriceHistoryRead
from app.schemas.product_spec import ProductSpecRead

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    brand: str | None = None
    image_path: str | None = None # Eg: images/products/product-1.jpg
    category_id: int
    short_describe: str | None = None

class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    id: int
    our_deal: float | None = None
    marked_price: float | None = None
    avg_rating: float
    rating_count: int

    @field_validator("avg_rating", mode="before")
    @classmethod
    def round_avg_rating(cls, v):
        if v is not None:
            return round(float(v), 2)
        return 0.0

class PartnerPrice(BaseModel):
    product_id: int
    partner_id: int
    partner_price: float
    stock_count: int
    partner_product_url: str | None = None
    date: datetime

class ProductDetailRead(BaseModel):
    product_info: ProductRead
    specs: List[ProductSpecRead] | None = None
    partner_prices: List[PartnerPrice] | None = None
    tags: List[TagRead] | None = None
    price_history: List[ProductPriceHistoryRead] | None = None