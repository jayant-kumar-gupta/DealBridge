from fastapi import APIRouter, status, HTTPException, Response, Query, Depends
from typing import Annotated, List
from app.models.database import Category, User
from app.core.database import SessionDep
from sqlmodel import select, func
from app.schemas.category import CategoryCreate, CategoryRead
from app.core.utils import require_admin
from slugify import slugify

router = APIRouter(prefix="/categories", tags=["Categories"])


# Creating Categories
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CategoryRead)
def create_cat(
    cat: CategoryCreate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> Category:
    category = Category(
        name=cat.name,
        slug=slugify(cat.name),
        description=cat.description,
        icon=cat.icon,
    )
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


# Count Categories
@router.get("/count")
def count_categories(
    session: SessionDep,
    name: str | None = None,
) -> dict[str, int]:
    statement = select(func.count()).select_from(Category)
    if name:
        statement = statement.where(func.lower(Category.name).like(f"%{name.lower()}%"))
    total = session.exec(statement).one()
    return {"count": total, "total": total}


# Displaying Categories
@router.get("/", response_model=List[CategoryRead])
def get_categories(
    session: SessionDep,
    response: Response,
    offset: Annotated[int, Query(ge=0)] = 0,
    name: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
) -> list[Category]:
    statement = select(Category)
    count_stmt = select(func.count()).select_from(Category)

    if name:
        pattern = f"%{name.lower()}%"
        statement = statement.where(func.lower(Category.name).like(pattern))
        count_stmt = count_stmt.where(func.lower(Category.name).like(pattern))

    total = session.exec(count_stmt).one()
    response.headers["X-Total-Count"] = str(total)

    categories = session.exec(statement.offset(offset).limit(limit)).all()
    return list(categories)


@router.get("/{id}", response_model=CategoryRead)
def get_cat_by_id(session: SessionDep, id: int) -> Category:
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


# Deleting Categories
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    session: SessionDep,
    id: int,
    current_user: User = Depends(require_admin),
):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    session.delete(category)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Updating Categories
@router.put("/{id}", response_model=CategoryRead)
def update_category(
    session: SessionDep,
    cat: CategoryCreate,
    id: int,
    current_user: User = Depends(require_admin),
) -> Category:
    category = session.get(Category, id)

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    category.name = cat.name
    category.slug = slugify(cat.name)
    category.description = cat.description
    category.icon = cat.icon

    session.add(category)
    session.commit()
    session.refresh(category)

    return category
