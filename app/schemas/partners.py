from pydantic import BaseModel

class PartnerBase(BaseModel):
    name: str
    description: str | None = None
    website_url: str | None = None
    badge_color: str | None = None

class PartnerCreate(PartnerBase):
    pass

class PartnerRead(PartnerBase):
    id: int