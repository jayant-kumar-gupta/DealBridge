from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.api.v1.endpoints.user_auth import require_admin
from app.core.database import SessionDep
from app.models.database import Product, ProductSpec, User
from app.schemas.product_spec import (
    ProductSpecCreate,
    ProductSpecRead,
    ProductSpecUpdate,
)


router = APIRouter(prefix="/product-specs", tags=["Product Specifications"])


def get_product_spec(
    product_id: int,
    label: str,
    session: SessionDep,
) -> ProductSpec:
    spec = session.get(ProductSpec, (product_id, label))
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product specification not found",
        )
    return spec


@router.post("/", response_model=ProductSpecRead, status_code=status.HTTP_201_CREATED)
def create_product_spec(
    detail: ProductSpecCreate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> ProductSpec:
    if not session.get(Product, detail.product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if session.get(ProductSpec, (detail.product_id, detail.label)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A specification with this label already exists for the product",
        )

    spec = ProductSpec(
        product_id=detail.product_id,
        label=detail.label,
        value=detail.value,
    )
    session.add(spec)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A specification with this label already exists for the product",
        )

    session.refresh(spec)
    return spec


@router.get("/{product_id}", response_model=list[ProductSpecRead])
def read_product_specs(product_id: int, session: SessionDep) -> list[ProductSpec]:
    if not session.get(Product, product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    statement = select(ProductSpec).where(ProductSpec.product_id == product_id)
    return list(session.exec(statement).all())


@router.get("/{product_id}/{label}", response_model=ProductSpecRead)
def read_product_spec(
    product_id: int,
    label: str,
    session: SessionDep,
) -> ProductSpec:
    return get_product_spec(product_id, label, session)


@router.put("/{product_id}/{label}", response_model=ProductSpecRead)
def update_product_spec(
    product_id: int,
    label: str,
    detail: ProductSpecUpdate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> ProductSpec:
    spec = get_product_spec(product_id, label, session)
    spec.value = detail.value
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec


@router.delete("/{product_id}/{label}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_spec(
    product_id: int,
    label: str,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> Response:
    spec = get_product_spec(product_id, label, session)
    session.delete(spec)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)