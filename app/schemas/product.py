from pydantic import BaseModel
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
    avg_rating: float
    rating_count: int

class PartnerPrice(BaseModel):
    product_id: int
    partner_id: int
    partner_name: str | None = None
    partner_color: str | None = None
    partner_price: float
    stock_count: int
    partner_product_url: str | None = None
    date: datetime

class ProductDetailRead(BaseModel):
    product_info: ProductRead
    category_name: str | None = None
    specs: List[ProductSpecRead] | None = None
    partner_prices: List[PartnerPrice] | None = None
    tags: List[TagRead] | None = None
    price_history: List[ProductPriceHistoryRead] | None = None