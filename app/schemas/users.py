from pydantic import BaseModel, EmailStr
from typing import Optional


class UserLoginResponse(BaseModel):
    jwt_token: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    firstname: str | None = None
    lastname: str | None = None

class Token(BaseModel):
    user_id: Optional[str] = None