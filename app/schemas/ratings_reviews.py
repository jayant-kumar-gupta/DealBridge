from pydantic import BaseModel, Field

class RatingSchema(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5, description="Rating must be between 1 and 5 stars")

class CommentBase(BaseModel):
    product_id: int
    comment: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    comment: str

class CommentRead(CommentBase):
    id: int
    user_id: int

    