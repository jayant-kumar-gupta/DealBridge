from pydantic import BaseModel, Field


class PartnerBase(BaseModel):
    name: str
    description: str | None = None
    website_url: str | None = None
    badge_color: str | None = None


class PartnerCreate(PartnerBase):
    pass


class PartnerRead(PartnerBase):
    id: int


class PartnerPriceCreate(BaseModel):
    product_id: int
    partner_id: int
    partner_price: float = Field(gt=0)
    marked_price: float | None = Field(default=None, gt=0)
    stock_count: int = Field(default=0, ge=0)
    partner_product_url: str | None = None


class PartnerPriceUpdate(BaseModel):
    product_id: int
    partner_id: int
    partner_price: float = Field(gt=0)
    marked_price: float | None = Field(default=None, gt=0)
    stock_count: int = Field(default=0, ge=0)
    partner_product_url: str | None = None
