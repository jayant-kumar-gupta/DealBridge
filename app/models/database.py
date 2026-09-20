from sqlmodel import SQLModel, Field, Relationship, text
from typing import List
from datetime import datetime, timezone
import secrets


class Category(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True) # Removed index = True because categories are not high in number
    slug: str | None = Field(index=True, default=None)
    description: str | None = Field(default=None)
    icon: str | None = Field(default=None) #icon field will contain the path for image for a category
    product_count: int = Field(default=0, sa_column_kwargs={"server_default": "0"})

    # class Products is kept in quote to avoid python NameError. Python Executes Top - Down approach
    products: List["Product"] | None = Relationship(back_populates="category")

class User(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    email: str | None = Field(index=True, unique=True)
    phone: str = Field(index=True, unique=True, max_length=20)
    password: str
    firstname: str | None = Field(default = None)
    lastname: str | None = Field(default = None)
    is_admin: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    join_date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})

class Rating(SQLModel, table = True): # One User is allowed to rate only one time
    product_id: int | None = Field(default=None, foreign_key="product.id", ondelete="CASCADE", primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE", primary_key=True)
    rating: float | None = Field(default=None)

class ProductComment(SQLModel, table = True): # A User is allowed to comment multiple times
    id: int | None = Field(default=None, primary_key=True)
    product_id: int | None = Field(default=None, foreign_key="product.id", ondelete="CASCADE")
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE")
    comment: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})

class Notification(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default= None, foreign_key="user.id", ondelete="CASCADE")
    type: str | None = Field(default=None)
    title: str | None = Field(default=None)
    message: str | None = Field(default=None)
    icon: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})
    link: str | None = Field(default=None)
    read: bool | None = Field(default=False, sa_column_kwargs={"server_default": text("false")})

class Cart(SQLModel, table = True):
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE", primary_key=True)
    product_id: int | None = Field(default=None, foreign_key="product.id", ondelete="CASCADE", primary_key=True)
    quantity: int | None = Field(default=1, sa_column_kwargs={"server_default": "1"})
    price: float | None = Field(default=0.0, sa_column_kwargs={"server_default": "0.0"})
    partner_id: int = Field(foreign_key="partner.id", ondelete="CASCADE")
    brand: str | None = Field(default=None)

    products: "Product" = Relationship()
    partner: "Partner" = Relationship()

class PartnerPrice(SQLModel, table = True):
    product_id: int | None = Field(default = None, foreign_key="product.id", ondelete="CASCADE", primary_key=True)
    partner_id: int | None = Field(default=None, foreign_key="partner.id", ondelete="CASCADE", primary_key=True)
    partner_price: float = Field()
    stock_count: int | None = Field(default=0, sa_column_kwargs={"server_default": "0"}) # to help with the stocks (to find out whether the product is in stock or not (for one partner))
    partner_product_url: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})

class Product(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    slug: str | None = Field(default=None, index=True)
    brand: str | None = Field(default = None)
    category_id: int = Field(foreign_key="category.id", ondelete="CASCADE")
    description: str | None = Field(default=None)
    short_describe: str | None = Field(default=None)
    image_path: str | None = Field(default=None)
    our_deal: float | None= Field(default=None) # Formed by applying discount on the mininum price
    avg_rating: float | None = Field(default=0.0, sa_column_kwargs={"server_default": "0.0"}) # Updated only when new user gives rating
    rating_count: int | None = Field(default=0, sa_column_kwargs={"server_default": "0"}) # Updated only when new user gives rating

    category: Category | None = Relationship(back_populates="products")
    partners: List["Partner"] | None = Relationship(back_populates="products", link_model=PartnerPrice)

class Partner(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = Field(default=None)
    website_url: str | None = Field(default = None, unique=True)
    # logo: str | None = Field(default=None, unique=True) # Image path of partner logo
    badge_color: str | None = Field(default="#4A90D9")

    products: List["Product"] | None = Relationship(back_populates="partners", link_model=PartnerPrice)

class Order(SQLModel, table = True):
    id: int | None =  Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
    product_id: int = Field(foreign_key="product.id", ondelete="CASCADE")
    partner_id: int = Field(foreign_key="partner.id", ondelete="CASCADE")
    amount_paid: float = Field()
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})
    promocode: str = Field(default_factory=lambda: secrets.token_urlsafe(16)) # Check pgadmin for this column
    status: str = Field(default="Active", sa_column_kwargs={"server_default": text("'Active'")})

class Address(SQLModel, table = True):
    id: int | None =  Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE")
    name: str | None = Field(default=None)
    phone: str | None = Field(default=None)
    address_line1: str = Field()
    address_line2: str | None = Field(default=None)
    city: str = Field()
    state: str = Field()
    pincode: int | None = Field(default=None)
    type: str | None = Field(default="Home")
    isdefault: bool | None = Field(default=True)

    user: User | None = Relationship()

