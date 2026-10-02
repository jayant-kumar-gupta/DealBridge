from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.api.v1.endpoints.user_auth import require_admin
from app.core.database import SessionDep
from app.models.database import Product, ProductTag, Tag, User
from app.schemas.tag import ProductTagCreate, ProductTagRead, TagRead


router = APIRouter(prefix="/product-tags", tags=["Product Tags"])


@router.post("/", response_model=ProductTagRead, status_code=status.HTTP_201_CREATED)
def assign_tag_to_product(
    detail: ProductTagCreate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> ProductTag:
    if not session.get(Product, detail.product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    if not session.get(Tag, detail.tag_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    if session.get(ProductTag, (detail.product_id, detail.tag_id)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag is already assigned to this product",
        )

    product_tag = ProductTag(
        product_id=detail.product_id,
        tag_id=detail.tag_id,
    )
    session.add(product_tag)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag is already assigned to this product",
        )

    return product_tag


@router.get("/{product_id}", response_model=list[TagRead])
def read_product_tags(product_id: int, session: SessionDep) -> list[Tag]:
    if not session.get(Product, product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    statement = (
        select(Tag)
        .join(ProductTag, ProductTag.tag_id == Tag.id)
        .where(ProductTag.product_id == product_id)
        .order_by(Tag.name)
    )
    return list(session.exec(statement).all())


@router.delete("/{product_id}-{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_product(
    product_id: int,
    tag_id: int,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> Response:
    product_tag = session.get(ProductTag, (product_id, tag_id))
    if not product_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag is not assigned to this product",
        )

    session.delete(product_tag)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)