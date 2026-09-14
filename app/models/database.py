from sqlmodel import SQLModel, Field, Relationship
from typing import List
from datetime import datetime, timezone


class Category(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True) # Removed index = True because categories are not high in number
    slug: str | None = Field(index=True, default=None)
    description: str | None = Field(default=None)
    icon: str | None = Field(default=None) #icon field will contain the path for image for a category
    product_count: int = Field(default=0, sa_column_kwargs={"server_default": "0"})

    # class Products is kept in quote to avoid python NameError. Python Executes Top - Down approach
    products: List["Products"] | None = Relationship(back_populates="category")

class Users(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    email: str | None = Field(index=True, unique=True)
    phone: str = Field(index=True, unique=True, max_length=20)
    password: str
    firstname: str | None = Field(default = None)
    lastname: str | None = Field(default = None)
    is_admin: bool = Field(default=False)
    join_date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerPrice(SQLModel, table = True):
    product_id: int | None = Field(default = None, foreign_key="products.id", ondelete="CASCADE", primary_key=True)
    partner_id: int | None = Field(default=None, foreign_key="partners.id", ondelete="CASCADE", primary_key=True)
    partner_price: float = Field()
    stock_count: int | None = Field(default=0) # to help with the stocks (to find out whether the product is in stock or not (for one partner))
    in_stock: bool = Field(default=True)
    partner_product_url: str | None = Field(default=None)


class Products(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    slug: str | None = Field(default=None, index=True)
    brand: str | None = Field(default = None)
    category_id: int = Field(foreign_key="category.id", ondelete="CASCADE")
    description: str | None = Field(default=None)
    short_describe: str | None = Field(default=None)
    our_deal: float | None = Field() # Formed by applying discount on the mininum price
    count: int | None = Field(default=0) # Formed by sum of products sold by all partners
    avg_rating: float | None = Field(default=0.0) # Updated only when new user gives rating
    rating_count: int | None = Field(default=0) # Updated only when new user gives rating

    category: Category | None = Relationship(back_populates="products")
    partners: List["Partners"] | None = Relationship(back_populates="products", link_model=PartnerPrice)

class Partners(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = Field(default=None)
    website_url: str | None = Field(default = None, unique=True)
    logo: str | None = Field(default=None, unique=True) # Image path of partner logo
    badge_color: str | None = Field(default="#4A90D9")
    status: bool | None = Field(default=True)
    active_deal_count: int | None = Field(default=0)

    products: List["Products"] | None = Relationship(back_populates="partners", link_model=PartnerPrice)


class Ratings(SQLModel, table = True): # One User is allowed to rate only one time
    product_id: int | None = Field(default=None, foreign_key="products.id", ondelete="CASCADE", primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="users.id", ondelete="CASCADE", primary_key=True)
    rating: float | None = Field(default=None)

class ProductComments(SQLModel, table = True): # A User is allowed to comment multiple times
    id: int | None = Field(default=None, primary_key=True)
    product_id: int | None = Field(default=None, foreign_key="products.id", ondelete="CASCADE")
    user_id: int | None = Field(default=None, foreign_key="users.id", ondelete="CASCADE")
    comment: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notifications(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default= None, foreign_key="users.id", ondelete="CASCADE")
    type: str | None = Field(default=None)
    title: str | None = Field(default=None)
    message: str | None = Field(default=None)
    icon: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc))
    link: str | None = Field(default=None)
    read: bool | None = Field(default=False)