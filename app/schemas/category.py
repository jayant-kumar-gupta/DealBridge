from pydantic import BaseModel, EmailStr

class CategoryBase(BaseModel):
    name: str
    description: str | None
    icon: str | None
    product_count: int

# Data required when Creating (no id)
class CategoryCreate(CategoryBase):
    pass

# Data returned when Reading (includes the database-generated id)
class CategoryRead(CategoryBase):
    id: int

class UserLogin(BaseModel):
    email: EmailStr
    id: int