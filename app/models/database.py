from sqlmodel import SQLModel, Field, Relationship, text
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
    rating: int | None = Field(default=None)

class ProductComment(SQLModel, table = True): # A User is allowed to comment multiple times
    id: int | None = Field(default=None, primary_key=True)
    product_id: int | None = Field(default=None, foreign_key="product.id", ondelete="CASCADE")
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE")
    comment: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})

class Cart(SQLModel, table = True):
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE", primary_key=True)
    product_id: int | None = Field(default=None, foreign_key="product.id", ondelete="CASCADE", primary_key=True)
    quantity: int = Field(default=1, sa_column_kwargs={"server_default": "1"})
    partner_id: int = Field(foreign_key="partner.id", ondelete="CASCADE")

    product: "Product" = Relationship()
    partner: "Partner" = Relationship()

class PartnerPrice(SQLModel, table = True):
    product_id: int | None = Field(default = None, foreign_key="product.id", ondelete="CASCADE", primary_key=True)
    partner_id: int | None = Field(default=None, foreign_key="partner.id", ondelete="CASCADE", primary_key=True)
    partner_price: float = Field()
    stock_count: int | None = Field(default=0, sa_column_kwargs={"server_default": "0"}) # to help with the stocks (to find out whether the product is in stock or not (for one partner))
    partner_product_url: str | None = Field(default=None)
    date: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})

    product: "Product" = Relationship(back_populates="partnerprices")

class ProductTag(SQLModel, table = True):
    product_id: int = Field(
        foreign_key="product.id",
        ondelete="CASCADE",
        primary_key=True,
    )
    tag_id: int = Field(
        foreign_key="tag.id",
        ondelete="CASCADE",
        primary_key=True,
    )

class Tag(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=50)

    products: List["Product"] | None = Relationship(
        back_populates="tags",
        link_model=ProductTag,
    )

class Product(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    slug: str | None = Field(default=None, index=True)
    brand: str | None = Field(default = None)
    category_id: int = Field(foreign_key="category.id", ondelete="CASCADE")
    description: str | None = Field(default=None)
    short_describe: str | None = Field(default=None)
    image_path: str | None = Field(default=None)
    our_deal: float | None = Field(default = None) # Formed by applying discount on the mininum price
    avg_rating: float = Field(default=0.0, sa_column_kwargs={"server_default": "0.0"}) # Updated only when new user gives rating
    rating_count: int = Field(default=0, sa_column_kwargs={"server_default": "0"}) # Updated only when new user gives rating

    category: "Category" = Relationship(back_populates="products")
    partners: List["Partner"] | None = Relationship(back_populates="products", link_model=PartnerPrice, sa_relationship_kwargs={"overlaps": "partnerprices,product"})
    partnerprices: List["PartnerPrice"] = Relationship(back_populates="product", sa_relationship_kwargs={"overlaps": "partners"})
    specs: List["ProductSpec"] = Relationship(
        back_populates="product",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    price_history: List["ProductPriceHistory"] = Relationship(
        back_populates="product",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    tags: List["Tag"] | None = Relationship(
        back_populates="products",
        link_model=ProductTag,
    )

class ProductSpec(SQLModel, table = True):
    product_id: int = Field(
        foreign_key="product.id",
        ondelete="CASCADE",
        primary_key=True,
    )
    label: str = Field(primary_key=True, max_length=100)
    value: str = Field(max_length=500)

    product: "Product" = Relationship(back_populates="specs")

class ProductPriceHistory(SQLModel, table = True):
    product_id: int = Field(
        foreign_key="product.id",
        ondelete="CASCADE",
        primary_key=True,
    )
    date: datetime = Field(primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", ondelete="CASCADE", primary_key=True)
    price: float

    product: "Product" = Relationship(back_populates="price_history")

class Partner(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = Field(default=None)
    website_url: str | None = Field(default = None, unique=True)
    # logo: str | None = Field(default=None, unique=True) # Image path of partner logo
    badge_color: str | None = Field(default="#4A90D9")

    products: List["Product"] | None = Relationship(back_populates="partners", link_model=PartnerPrice, sa_relationship_kwargs={"overlaps": "partnerprices,product"})

class Order(SQLModel, table = True):
    id: int | None =  Field(default=None, primary_key=True)
    user_id: int | None = Field(foreign_key="user.id", ondelete="CASCADE")
    address_id: int = Field(foreign_key="address.id")
    promocode: str = Field()
    amount_paid: float = Field()
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"server_default": text("now()")})
    status: str = Field(default="Active", sa_column_kwargs={"server_default": text("'Active'")})

    items: List["OrderItem"] = Relationship(back_populates="order", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    address: "Address" = Relationship()

class OrderItem(SQLModel, table = True):
    id: int | None = Field(default = None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", ondelete="CASCADE")
    product_id: int = Field(foreign_key="product.id")
    quantity: int = Field(default=1, sa_column_kwargs={"server_default": "1"})
    partner_id: int = Field(foreign_key="partner.id")
    price: float = Field()

    order: "Order" = Relationship(back_populates="items")
    product: "Product" = Relationship()
    partner: "Partner" = Relationship()

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
    isdefault: bool = Field(default=True)

    user: "User" = Relationship()

