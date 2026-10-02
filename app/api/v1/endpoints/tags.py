from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.api.v1.endpoints.user_auth import require_admin
from app.core.database import SessionDep
from app.models.database import Tag, User
from app.schemas.tag import TagCreate, TagRead, TagUpdate


router = APIRouter(prefix="/tags", tags=["Tags"])


@router.post("/", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    detail: TagCreate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> Tag:
    if session.exec(select(Tag).where(Tag.name == detail.name)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag already exists",
        )

    tag = Tag(name=detail.name)
    session.add(tag)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag already exists",
        )

    session.refresh(tag)
    return tag


@router.get("/", response_model=list[TagRead])
def read_tags(session: SessionDep) -> list[Tag]:
    return list(session.exec(select(Tag).order_by(Tag.name)).all())


@router.get("/{tag_id}", response_model=TagRead)
def read_tag(tag_id: int, session: SessionDep) -> Tag:
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    return tag


@router.put("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: int,
    detail: TagUpdate,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> Tag:
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    existing_tag = session.exec(
        select(Tag).where(Tag.name == detail.name, Tag.id != tag_id)
    ).first()
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag already exists",
        )

    tag.name = detail.name
    session.add(tag)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag already exists",
        )

    session.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> Response:
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    session.delete(tag)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)