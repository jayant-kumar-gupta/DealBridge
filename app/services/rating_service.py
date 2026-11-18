from sqlmodel import Session, select
from app.models.database import Product, ProductComment, User
from app.schemas.ratings_reviews import CommentRead


def sync_avg_rating_create(session: Session, product_id: int, rating: int) -> None:
    product = session.get(Product, product_id)
    if not product:
        return
    old_avgrating = product.avg_rating
    old_count = product.rating_count
    new_count = old_count + 1
    product.avg_rating = round(((old_avgrating * old_count) + rating) / new_count, 2)
    product.rating_count = new_count
    session.add(product)
    session.flush()


def sync_avg_rating_update(
    session: Session, product_id: int, old_rating: int, new_rating: int
) -> None:
    product = session.get(Product, product_id)
    if not product:
        return
    old_avgrating = product.avg_rating
    count = product.rating_count
    if count == 0:
        product.avg_rating = float(new_rating)
    else:
        product.avg_rating = round(((old_avgrating * count) + new_rating - old_rating) / count, 2)
    session.add(product)
    session.flush()


def sync_avg_rating_delete(session: Session, product_id: int, rating: int) -> None:
    product = session.get(Product, product_id)
    if not product:
        return
    old_avgrating = product.avg_rating
    old_count = product.rating_count
    new_count = max(0, old_count - 1)
    if new_count == 0:
        product.avg_rating = 0.0
    else:
        product.avg_rating = round(((old_avgrating * old_count) - rating) / new_count, 2)
    product.rating_count = new_count
    session.add(product)
    session.flush()


def _format_user_name(user: User | None, user_id: int | None) -> str:
    if user:
        user_name = f"{user.firstname or ''} {user.lastname or ''}".strip()
        if user_name:
            return user_name
        if user.email:
            return user.email.split("@")[0]
    return f"User #{user_id}" if user_id is not None else "Anonymous"


def build_comment_read(
    comment: ProductComment, session: Session, user: User | None = None
) -> CommentRead:
    if not user and comment.user_id:
        user = session.get(User, comment.user_id)
    return CommentRead(
        id=comment.id,
        product_id=comment.product_id,
        user_id=comment.user_id,
        comment=comment.comment,
        user_name=_format_user_name(user, comment.user_id),
        date=comment.date,
    )


def build_comments_read(
    comments: list[ProductComment],
    session: Session,
    known_user: User | None = None,
) -> list[CommentRead]:
    """Batch-load comment authors in one query to avoid N+1 queries."""
    if not comments:
        return []

    users_by_id: dict[int, User] = {}
    if known_user and known_user.id is not None:
        users_by_id[known_user.id] = known_user

    missing_user_ids = {
        c.user_id for c in comments if c.user_id is not None and c.user_id not in users_by_id
    }
    if missing_user_ids:
        users = session.exec(select(User).where(User.id.in_(missing_user_ids))).all()
        for u in users:
            if u.id is not None:
                users_by_id[u.id] = u

    return [
        CommentRead(
            id=c.id,
            product_id=c.product_id,
            user_id=c.user_id,
            comment=c.comment,
            user_name=_format_user_name(users_by_id.get(c.user_id), c.user_id),
            date=c.date,
        )
        for c in comments
    ]
