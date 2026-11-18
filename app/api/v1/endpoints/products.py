from fastapi import APIRouter, Query, HTTPException, status, Depends, Response
from sqlalchemy import case
from sqlalchemy.orm import selectinload
from sqlmodel import select, func, or_
from slugify import slugify
from app.core.database import SessionDep
from typing import Annotated, List
from app.core.utils import require_admin
from app.models.database import Product, User, Category
from app.schemas.product import ProductCreate, ProductRead, ProductDetailRead

router = APIRouter(prefix="/products", tags=["products"])


def _build_product_filter_query(
    name: str | None = None,
    q: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    deals_only: bool = False,
):
    statement = select(Product)
    search_term = q or name
    if search_term:
        pattern = f"%{search_term.lower()}%"
        statement = statement.where(
            or_(
                func.lower(Product.name).like(pattern),
                func.lower(func.coalesce(Product.brand, "")).like(pattern),
                func.lower(func.coalesce(Product.description, "")).like(pattern),
                func.lower(func.coalesce(Product.short_describe, "")).like(pattern),
            )
        )
    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    if brand:
        brands = [b.strip() for b in brand.split(",") if b.strip()]
        if len(brands) == 1:
            statement = statement.where(func.lower(func.coalesce(Product.brand, "")) == brands[0].lower())
        elif brands:
            statement = statement.where(func.lower(func.coalesce(Product.brand, "")).in_([b.lower() for b in brands]))
    if deals_only:
        statement = statement.where(
            Product.our_deal.is_not(None),
            Product.our_deal > 0,
            Product.marked_price.is_not(None),
            Product.marked_price > Product.our_deal,
        )
    valid_price = case(
        ((Product.our_deal.is_not(None)) & (Product.our_deal > 0), Product.our_deal),
        else_=None,
    )
    if min_price is not None and min_price > 0:
        statement = statement.where(valid_price.is_not(None), valid_price >= min_price)
    if max_price is not None and max_price > 0:
        statement = statement.where(valid_price.is_not(None), valid_price <= max_price)
    return statement


def _apply_product_sort(statement, sort_by: str | None):
    if not sort_by or sort_by == "relevance":
        return statement
    effective_price = case(
        ((Product.our_deal.is_not(None)) & (Product.our_deal > 0), Product.our_deal),
        else_=None,
    )
    if sort_by == "price-low":
        return statement.order_by(effective_price.asc().nullslast(), Product.id.asc())
    if sort_by == "price-high":
        return statement.order_by(effective_price.desc().nullslast(), Product.id.asc())
    if sort_by == "rating":
        return statement.order_by(Product.avg_rating.desc(), Product.rating_count.desc(), Product.id.asc())
    if sort_by == "name-asc":
        return statement.order_by(func.lower(Product.name).asc())
    if sort_by == "name-desc":
        return statement.order_by(func.lower(Product.name).desc())
    if sort_by == "discount":
        discount_pct = case(
            (
                (Product.our_deal.is_not(None))
                & (Product.our_deal > 0)
                & (Product.marked_price.is_not(None))
                & (Product.marked_price > Product.our_deal)
                & (Product.marked_price > 0),
                (Product.marked_price - Product.our_deal) / Product.marked_price,
            ),
            else_=-1.0,
        )
        return statement.order_by(discount_pct.desc(), Product.id.asc())
    if sort_by == "savings":
        savings_amt = case(
            (
                (Product.our_deal.is_not(None))
                & (Product.our_deal > 0)
                & (Product.marked_price.is_not(None))
                & (Product.marked_price > Product.our_deal),
                Product.marked_price - Product.our_deal,
            ),
            else_=-1.0,
        )
        return statement.order_by(savings_amt.desc(), Product.id.asc())
    return statement


# Count Products
@router.get("/count")
def count_products(
    session: SessionDep,
    name: str | None = None,
    q: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    deals_only: bool = False,
) -> dict[str, int]:
    filtered = _build_product_filter_query(
        name=name,
        q=q,
        category_id=category_id,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        deals_only=deals_only,
    )
    total = session.exec(select(func.count()).select_from(filtered.subquery())).one()
    return {"count": total, "total": total}


# Reading Products
@router.get("/", response_model=List[ProductRead])
def get_products(
    session: SessionDep,
    response: Response,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    name: str | None = None,
    q: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    deals_only: bool = False,
    sort_by: str | None = None,
) -> List[Product]:
    statement = _build_product_filter_query(
        name=name,
        q=q,
        category_id=category_id,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        deals_only=deals_only,
    )

    total = session.exec(select(func.count()).select_from(statement.subquery())).one()
    response.headers["X-Total-Count"] = str(total)

    statement = _apply_product_sort(statement, sort_by)
    products = session.exec(statement.offset(offset).limit(limit)).all()
    return list(products)


# Reading Products By ID
@router.get("/{id}", response_model=ProductDetailRead)
def get_products_by_id(session: SessionDep, id: int):
    statement = (
        select(Product)
        .where(Product.id == id)
        .options(
            selectinload(Product.specs),
            selectinload(Product.tags),
            selectinload(Product.price_history),
            selectinload(Product.partnerprices),
        )
    )
    product = session.exec(statement).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No products found with that id!")

    return {
        "product_info": product,
        "specs": product.specs,
        "partner_prices": product.partnerprices,
        "tags": product.tags,
        "price_history": product.price_history,
    }


# Creating product: Create products should modify the product_count in Category table for a specific category
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductRead)
def create_product(
    product_detail: ProductCreate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
):
    category = session.get(Category, product_detail.category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    product = Product(
        name=product_detail.name,
        slug=slugify(product_detail.name),
        brand=product_detail.brand,
        description=product_detail.description,
        short_describe=product_detail.short_describe,
        category_id=product_detail.category_id,
        image_path=product_detail.image_path,
    )

    session.add(product)
    category.product_count += 1
    session.add(category)

    session.commit()
    session.refresh(product)

    return product


# Updating products
@router.put("/{id}", response_model=ProductRead)
def update_product(
    session: SessionDep,
    product_detail: ProductCreate,
    id: int,
    current_user: User = Depends(require_admin),
):
    product_db = session.get(Product, id)
    if not product_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No match for product with that id!")

    # If admin is updating category id:
    if product_db.category_id != product_detail.category_id:
        new_category = session.get(Category, product_detail.category_id)
        if not new_category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target category not found")

        old_category = session.get(Category, product_db.category_id)
        if old_category:
            old_category.product_count = max(0, old_category.product_count - 1)
            session.add(old_category)

        new_category.product_count += 1
        session.add(new_category)

    product_db.name = product_detail.name
    product_db.slug = slugify(product_detail.name)
    product_db.brand = product_detail.brand
    product_db.description = product_detail.description
    product_db.short_describe = product_detail.short_describe
    product_db.category_id = product_detail.category_id
    product_db.image_path = product_detail.image_path

    session.add(product_db)
    session.commit()
    session.refresh(product_db)

    return product_db


# Deleting Products
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    session: SessionDep,
    id: int,
    current_user: User = Depends(require_admin),
):
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product with that id not found!")

    category = session.get(Category, product.category_id)
    if category:
        category.product_count = max(0, category.product_count - 1)
        session.add(category)

    session.delete(product)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
