from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select
from app.schemas.ratings_reviews import RatingSchema, CommentCreate, CommentRead, CommentUpdate
from app.models.database import ProductComment, Rating, Product, User
from app.core.utils import get_current_user

router = APIRouter(prefix="/ratings", tags=["Ratings and Reviews"])

def sync_avg_rating_create(session, product_id: int, rating: int):
    product = session.get(Product, product_id)
    if not product:
        return
    old_avgrating = product.avg_rating
    old_count = product.rating_count
    new_count = old_count + 1
    new_avgrating = ((old_avgrating * old_count) + rating) / new_count
    product.avg_rating = new_avgrating
    product.rating_count += 1

    session.add(product)
    session.flush()

def sync_avg_rating_update(session, product_id: int, old_rating: int, new_rating: int):
    product = session.get(Product, product_id)
    if not product:
        return
    old_avgrating = product.avg_rating
    count = product.rating_count
    if count == 0:
        product.avg_rating = float(new_rating)
    else:
        new_avgrating = ((old_avgrating * count) + new_rating - old_rating) / count
        product.avg_rating = new_avgrating

    session.add(product)
    session.flush()

def sync_avg_rating_delete(session, product_id: int, rating: int):
    product = session.get(Product, product_id)
    if not product:
        return
    old_avgrating = product.avg_rating
    old_count = product.rating_count
    new_count = max(0, old_count - 1)
    if new_count == 0:
        product.avg_rating = 0.0
    else:
        product.avg_rating = ((old_avgrating * old_count) - rating) / new_count
    product.rating_count = new_count

    session.add(product)
    session.flush()

# Create Rating
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=Rating)
def create_rating(rating_detail: RatingSchema, session: SessionDep, current_user: User = Depends(get_current_user)) -> Rating:
    product = session.get(Product, rating_detail.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing_rating = session.get(Rating, (rating_detail.product_id, current_user.id))
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already rated this product. Use PUT to update your rating."
        )
    rating = Rating(
        user_id = current_user.id,
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
def get_ratings_by_user_id(session: SessionDep, current_user: User = Depends(get_current_user)) -> List[Rating]:
    ratings = session.exec(select(Rating).where(Rating.user_id == current_user.id)).all()
    if not ratings:
        return []
    return list(ratings)

# Read Ratings By Prouduct ID
@router.get("/product-{id}", response_model=List[Rating])
def get_ratings_by_product_id(id: int, session: SessionDep) -> List[Rating]:
    ratings = session.exec(select(Rating).where(Rating.product_id == id)).all()
    if not ratings:
        return []
    return list(ratings)

# Read One Rating
@router.get("/{product_id}", response_model=Rating)
def get_rating(product_id: int, session: SessionDep, current_user: User = Depends(get_current_user)) -> Rating:
    rating = session.get(Rating, (product_id, current_user.id))
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No rating detail found")
    return rating

# Update Rating
@router.put("/", response_model=Rating)
def update_rating(rating_detail: RatingSchema, session: SessionDep, current_user: User = Depends(get_current_user)) -> Rating:
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
def delete_rating(product_id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    rating = session.get(Rating, (product_id, current_user.id))
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No rating detail found")
    session.delete(rating)
    sync_avg_rating_delete(session, product_id, rating.rating)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

def build_comment_read(comment: ProductComment, session: SessionDep, user: User | None = None) -> CommentRead:
    if not user and comment.user_id:
        user = session.get(User, comment.user_id)
    user_name = None
    if user:
        user_name = f"{user.firstname or ''} {user.lastname or ''}".strip()
        if not user_name:
            user_name = user.email.split("@")[0] if user.email else f"User #{user.id}"
    return CommentRead(
        id=comment.id,
        product_id=comment.product_id,
        user_id=comment.user_id,
        comment=comment.comment,
        user_name=user_name,
        date=comment.date,
    )

# Create Comment
@router.post("/comment", status_code=status.HTTP_201_CREATED, response_model=CommentRead)
def create_comment(comment_detail: CommentCreate, session: SessionDep, current_user: User = Depends(get_current_user)) -> CommentRead:
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

# Read Comments By User ID (Not generally used)
@router.get("/comment", response_model=List[CommentRead])
def get_comments_by_user_id(session: SessionDep, current_user: User = Depends(get_current_user)) -> List[CommentRead]:
    comments = session.exec(select(ProductComment).where(ProductComment.user_id == current_user.id)).all()
    if not comments:
        return []
    return [build_comment_read(c, session, current_user) for c in comments]

# Read Comments By Prouduct ID
@router.get("/comment/product-{id}", response_model=List[CommentRead])
def get_comments_by_product_id(id: int, session: SessionDep) -> List[CommentRead]:
    comments = session.exec(select(ProductComment).where(ProductComment.product_id == id)).all()
    if not comments:
        return []
    return [build_comment_read(c, session) for c in comments]

# Read Comments of one user done in one product
@router.get("/comment/{product_id}", response_model=List[CommentRead])
def get_comments(product_id: int, session: SessionDep, current_user: User = Depends(get_current_user)) -> List[CommentRead]:
    comments = session.exec(select(ProductComment).where(ProductComment.user_id == current_user.id, ProductComment.product_id == product_id)).all()
    if not comments:
        return []
    return [build_comment_read(c, session, current_user) for c in comments]

# Read Comment By commentID
@router.get("/comment/{id}", response_model=CommentRead)
def get_comment_by_id(id: int, session: SessionDep, current_user: User = Depends(get_current_user)) -> CommentRead:
    comment = session.get(ProductComment, id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No comment found with that id!")
    return build_comment_read(comment, session)

# Edit comment by comment ID
@router.put("/comment/{id}", response_model=CommentRead)
def update_comment(id: int, comment_detail: CommentUpdate, session: SessionDep, current_user: User = Depends(get_current_user)) -> CommentRead:
    comment = session.get(ProductComment, id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found!")

    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")

    comment.comment = comment_detail.comment
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return build_comment_read(comment, session, current_user)

# Delete Comment By CommentID
@router.delete("/comment/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    comment = session.get(ProductComment, id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found!")

    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    session.delete(comment)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)