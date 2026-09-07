from fastapi import APIRouter, status, HTTPException, Response, Query
from typing import Annotated, List
from app.models.database import Category
from app.core.database import create_db_and_tables, SessionDep
from sqlmodel import select
from app.schemas.category import CategoryCreate, CategoryRead

router = APIRouter(prefix="/categories", tags=["Categories"])

# Creating Categories
@router.post("/categories/", status_code=status.HTTP_201_CREATED, response_model=CategoryCreate)
def create_cat(cat: Category, session: SessionDep) -> Category:
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


# Displaying Categories
@router.get("/categories", response_model = List[CategoryRead])
def get_categories(
    session: SessionDep,
    offset: int = 0,
    name: str | None = None,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Category]:
    statement = select(Category)

    if name:
        statement = statement.where(Category.name.ilike(f"%{name}%"))
    categories = session.exec(statement.offset(offset).limit(limit)).all()
    return list(categories)

@router.get("/categories/{id}", response_model = CategoryRead)
def get_cat_by_id(session: SessionDep, id: int) -> Category:
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category

# Deleting Categories
@router.delete("/categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(session: SessionDep, id: int):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    session.delete(category)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Updating Categories
@router.put("/categories/{id}", response_model=CategoryCreate)
def update_category(session: SessionDep, cat: Category, id: int):
    category = session.get(Category, id)

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    category.name = cat.name
    category.slug = cat.slug
    category.description = cat.description
    category.icon = cat.icon
    category.product_count = cat.product_count

    session.add(category)
    session.commit()
    session.refresh(category)

    return category