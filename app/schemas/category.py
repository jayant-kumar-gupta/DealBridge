from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    description: str | None
    icon: str | None

# Data required when Creating (no id)
class CategoryCreate(CategoryBase):
    pass

# Data returned when Reading (includes the database-generated id)
class CategoryRead(CategoryBase):
    id: int