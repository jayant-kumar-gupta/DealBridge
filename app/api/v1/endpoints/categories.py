from fastapi import APIRouter, status, HTTPException, Response, Query, Depends
from typing import Annotated, List
from app.models.database import Category
from app.core.database import SessionDep
from sqlmodel import select
from app.schemas.category import CategoryCreate, CategoryRead
from app.schemas.users import Token
from app.api.v1.endpoints.user_auth import require_admin

router = APIRouter(prefix="/categories", tags=["Categories"])

# Creating Categories
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CategoryCreate)
def create_cat(cat: Category, session: SessionDep, current_user: Token = Depends(require_admin)) -> Category:
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


# Displaying Categories
@router.get("/", response_model = List[CategoryRead])
def get_categories(
    session: SessionDep,
    offset: int = 0,
    name: str | None = None,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Category]:
    statement = select(Category)

    if name:
        statement = statement.where(name.lower() in Category.name.lower())
    categories = session.exec(statement.offset(offset).limit(limit)).all()
    return list(categories)

@router.get("/{id}", response_model = CategoryRead)
def get_cat_by_id(session: SessionDep, id: int) -> Category:
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category

# Deleting Categories
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(session: SessionDep, id: int, current_user: Token = Depends(require_admin)):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    session.delete(category)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Updating Categories
@router.put("/{id}", response_model=CategoryCreate)
def update_category(session: SessionDep, cat: Category, id: int, current_user: Token = Depends(require_admin)):
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