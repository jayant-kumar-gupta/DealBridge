from fastapi import APIRouter, Query, HTTPException, status, Depends, Response
from sqlmodel import select, func
from slugify import slugify
from app.core.database import SessionDep
from typing import Annotated, List
from app.api.v1.endpoints.user_auth import require_admin
from app.models.database import Product, User, Category
from app.schemas.product import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["products"])

# Reading Products
@router.get("/", response_model=List[ProductRead])
def get_products(
        session: SessionDep, 
        limit: Annotated[int, Query(le=20)] = 20, 
        offset: int = 0, 
        name: str | None = None,
    ) -> List[Product]:
    statement = select(Product)
    if name:
        statement = statement.where(func.lower(Product.name).like(f"%{name.lower()}%"))

    products = session.exec(statement.offset(offset).limit(limit)).all()

    return list(products)

# Reading Products By ID
@router.get("/{id}", response_model=ProductRead)
def get_products_by_id(session: SessionDep, id: int,) -> Product:
    product = session.get(Product, id)

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No products found with that id!")

    return product

# Creating product: Create products should modify the product_count in Category table for a specific category
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductRead)
def create_product(product_detail: ProductCreate, session: SessionDep, current_user: User = Depends(require_admin)):

    category = session.get(Category, product_detail.category_id)

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
def update_product(session: SessionDep, product_detail: ProductCreate, id: int, current_user: User = Depends(require_admin)):
    product_db = session.get(Product, id)
    if not product_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No match for product with that id!")

    # If admin is updating category id:
    category = session.get(Category, product_db.category_id)
    if category.id != product_detail.category_id:
        category.product_count -= 1
        category = session.get(Category, product_detail.category_id)
        category.product_count += 1
        session.add(category)

    product_db.name=product_detail.name
    product_db.slug=slugify(product_detail.name)
    product_db.brand=product_detail.brand
    product_db.description=product_detail.description
    product_db.short_describe=product_detail.short_describe
    product_db.category_id=product_detail.category_id
    product_db.image_path=product_detail.image_path

    session.add(product_db)
    session.commit()
    session.refresh(product_db)

    return product_db

# Deleting Products
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(session: SessionDep, id: int, current_user: User = Depends(require_admin)):
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product with that id not found!")

    category = session.get(Category, product.category_id)

    category.product_count -= 1

    session.delete(product)
    session.add(category)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)