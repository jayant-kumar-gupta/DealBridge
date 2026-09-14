from pydantic import BaseModel, EmailStr


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRegister(BaseModel):
    phone: str
    password: str
    email: EmailStr | None = None
    firstname: str | None = None
    lastname: str | None = None

class Token(BaseModel):
    user_id: int
    role: str

class AdminRegister(BaseModel):
    phone: str
    email: EmailStr | None = None
    password: str