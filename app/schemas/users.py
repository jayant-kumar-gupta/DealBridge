from pydantic import BaseModel, EmailStr
from typing import Optional


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    firstname: str | None = None
    lastname: str | None = None

class Token(BaseModel):
    user_id: int
    role: str

class AdminRegister(BaseModel):
    email: EmailStr
    password: str