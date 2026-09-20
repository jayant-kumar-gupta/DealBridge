from pydantic import BaseModel


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
    our_deal: float
    avg_rating: float
    rating_count: int