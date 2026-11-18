from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from app.schemas.ratings_reviews import RatingSchema, CommentCreate, CommentRead, CommentUpdate
from app.models.database import ProductComment, Rating, Product, User
from app.core.utils import get_current_user, require_admin
from app.services.rating_service import (
    build_comment_read,
    build_comments_read,
    sync_avg_rating_create,
    sync_avg_rating_delete,
    sync_avg_rating_update,
)

router = APIRouter(prefix="/ratings", tags=["Ratings and Reviews"])


# Create Rating
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=Rating)
def create_rating(
    rating_detail: RatingSchema,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Rating:
    product = session.get(Product, rating_detail.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing_rating = session.get(Rating, (rating_detail.product_id, current_user.id))
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already rated this product. Use PUT to update your rating.",
        )
    rating = Rating(
        user_id=current_user.id,
        product_id=rating_detail.product_id,
        rating=rating_detail.rating,
    )
    session.add(rating)
    session.flush()
    sync_avg_rating_create(session, rating_detail.product_id, rating_detail.rating)
    session.commit()
    session.refresh(rating)
    return rating


# Read Ratings By User ID
@router.get("/", response_model=List[Rating])
def get_ratings_by_user_id(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> List[Rating]:
    ratings = session.exec(select(Rating).where(Rating.user_id == current_user.id)).all()
    return list(ratings)


# Read Ratings By Product ID
@router.get("/product-{id}", response_model=List[Rating])
def get_ratings_by_product_id(id: int, session: SessionDep) -> List[Rating]:
    ratings = session.exec(select(Rating).where(Rating.product_id == id)).all()
    return list(ratings)


# Read One Rating
@router.get("/{product_id}", response_model=Rating)
def get_rating(
    product_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Rating:
    rating = session.get(Rating, (product_id, current_user.id))
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No rating detail found")
    return rating


# Update Rating
@router.put("/", response_model=Rating)
def update_rating(
    rating_detail: RatingSchema,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Rating:
    rating = session.get(Rating, (rating_detail.product_id, current_user.id))
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No rating detail found")
    old_rating = rating.rating
    rating.rating = rating_detail.rating
    session.add(rating)
    session.flush()
    sync_avg_rating_update(session, rating_detail.product_id, old_rating, rating_detail.rating)
    session.commit()
    session.refresh(rating)
    return rating


# Delete Rating
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    product_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    rating = session.get(Rating, (product_id, current_user.id))
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No rating detail found")
    session.delete(rating)
    sync_avg_rating_delete(session, product_id, rating.rating)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Create Comment
@router.post("/comment", status_code=status.HTTP_201_CREATED, response_model=CommentRead)
def create_comment(
    comment_detail: CommentCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> CommentRead:
    product = session.get(Product, comment_detail.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    comment = ProductComment(
        product_id=comment_detail.product_id,
        user_id=current_user.id,
        comment=comment_detail.comment,
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return build_comment_read(comment, session, current_user)


# Read all comments (For admins)
@router.get("/comment/all", response_model=List[CommentRead])
def get_all_comments(
    session: SessionDep,
    current_user: User = Depends(require_admin),
) -> List[CommentRead]:
    comments = list(session.exec(select(ProductComment)).all())
    return build_comments_read(comments, session)


# Read Comments By User ID
@router.get("/comment", response_model=List[CommentRead])
def get_comments_by_user_id(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> List[CommentRead]:
    comments = list(
        session.exec(select(ProductComment).where(ProductComment.user_id == current_user.id)).all()
    )
    return build_comments_read(comments, session, current_user)


# Read Comments By Product ID
@router.get("/comment/product-{id}", response_model=List[CommentRead])
def get_comments_by_product_id(id: int, session: SessionDep) -> List[CommentRead]:
    comments = list(
        session.exec(select(ProductComment).where(ProductComment.product_id == id)).all()
    )
    return build_comments_read(comments, session)


# Read current user's comments on a specific product
@router.get("/comment/user/{product_id}", response_model=List[CommentRead])
def get_user_comments_for_product(
    product_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> List[CommentRead]:
    comments = list(
        session.exec(
            select(ProductComment).where(
                ProductComment.user_id == current_user.id,
                ProductComment.product_id == product_id,
            )
        ).all()
    )
    return build_comments_read(comments, session, current_user)


# Read Comment By commentID
@router.get("/comment/{id}", response_model=CommentRead)
def get_comment_by_id(
    id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> CommentRead:
    comment = session.get(ProductComment, id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No comment found with that id!")
    return build_comment_read(comment, session)


# Edit comment by comment ID
@router.put("/comment/{id}", response_model=CommentRead)
def update_comment(
    id: int,
    comment_detail: CommentUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> CommentRead:
    comment = session.get(ProductComment, id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found!")

    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")

    comment.comment = comment_detail.comment
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return build_comment_read(comment, session)


# Delete Comment By CommentID
@router.delete("/comment/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    comment = session.get(ProductComment, id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found!")

    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    session.delete(comment)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
