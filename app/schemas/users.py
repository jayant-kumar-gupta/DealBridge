from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr | None = None
    phone: str
    firstname: str | None = None
    lastname: str | None = None
    name: str | None = None
    is_admin: bool = False
    role: str = "user"
    join_date: datetime | None = None
    joinDate: str | None = None
    avatar: str | None = None


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead | None = None


class UserRegister(BaseModel):
    phone: str
    password: str
    email: EmailStr | None = None
    name: str | None = None
    firstname: str | None = None
    lastname: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    firstname: str | None = None
    lastname: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class Token(BaseModel):
    user_id: int
    role: str


class AdminRegister(BaseModel):
    phone: str
    email: EmailStr | None = None
    password: str

class ForgotPasswordRequest(BaseModel):
    identifier: EmailStr | str

class VerifyOTPRequest(BaseModel):
    identifier: EmailStr | str
    otp: str

class ResetPasswordRequest(BaseModel):
    identifier: EmailStr | str
    otp: str
    new_password: str