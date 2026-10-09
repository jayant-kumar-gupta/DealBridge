from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlmodel import select
from app.schemas.users import UserRegister, UserLoginResponse, AdminRegister, UserRead, UserUpdate
from app.core.database import SessionDep
from app.models.database import User
from app.core.utils import hash, verify, create_access_token, get_current_user

router = APIRouter(prefix="/login", tags=["Login & Authentication"])

def is_strong_password(password: str) -> bool:
    count = 0
    contains_lower = False
    contains_upper = False
    contains_digit = False
    contains_special = False

    for ch in password:
        if ch.isupper():
            contains_upper = True
        elif ch.islower():
            contains_lower = True
        elif ch.isnumeric():
            contains_digit = True
        else:
            contains_special = True

        count += 1

    if contains_lower and contains_upper and contains_digit and contains_special and count >= 8:
        return True
    return False


def build_user_read(user: User) -> UserRead:
    full_name = f"{user.firstname or ''} {user.lastname or ''}".strip()
    if not full_name:
        full_name = user.email.split("@")[0] if user.email else "User"
    role = "admin" if user.is_admin else "user"
    join_date_str = user.join_date.strftime("%b %Y") if user.join_date else "Jan 2026"
    return UserRead(
        id=user.id,
        email=user.email,
        phone=user.phone,
        firstname=user.firstname,
        lastname=user.lastname,
        name=full_name,
        is_admin=user.is_admin,
        role=role,
        join_date=user.join_date,
        joinDate=join_date_str,
        avatar=None,
    )


def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to access this page.")
    return current_user


@router.post(
    "/",
    response_model=UserLoginResponse,
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "example": "abc@gmail.com"},
                            "password": {"type": "string", "example": "yourpassword"}
                        },
                        "required": ["password"]
                    }
                },
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "username": {"type": "string"},
                            "password": {"type": "string"}
                        },
                        "required": ["username", "password"]
                    }
                }
            }
        }
    }
)
async def user_login(
    request: Request,
    session: SessionDep,
):
    username = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email") or body.get("phone")
            password = body.get("password")
        except Exception:
            pass
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        username = form.get("username") or form.get("email") or form.get("phone")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email") or body.get("phone")
            password = body.get("password")
        except Exception:
            form = await request.form()
            username = form.get("username") or form.get("email") or form.get("phone")
            password = form.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/Email and password are required"
        )

    statement = select(User).where((User.email == str(username).strip()) | (User.phone == str(username).strip()))
    database_user = session.exec(statement).first()

    if not database_user or not verify(password, database_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")

    user_data = build_user_read(database_user)
    access_token = create_access_token({
        "user_id": database_user.id,
        "user_email": database_user.email,
        "role": user_data.role,
    })
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    }


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return build_user_read(current_user)


@router.put("/me", response_model=UserRead)
def update_current_user_profile(
    user_update: UserUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    if user_update.name and not user_update.firstname:
        parts = user_update.name.strip().split(" ", 1)
        user_update.firstname = parts[0]
        user_update.lastname = parts[1] if len(parts) > 1 else None

    if user_update.firstname is not None:
        current_user.firstname = user_update.firstname
    if user_update.lastname is not None:
        current_user.lastname = user_update.lastname
    if user_update.email is not None and user_update.email != current_user.email:
        existing_email = session.exec(
            select(User).where(User.email == user_update.email, User.id != current_user.id)
        ).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
        current_user.email = user_update.email
    if user_update.phone is not None and user_update.phone != current_user.phone:
        existing_phone = session.exec(
            select(User).where(User.phone == user_update.phone, User.id != current_user.id)
        ).first()
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone No. is already registered")
        current_user.phone = user_update.phone

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return build_user_read(current_user)


@router.get("/{user_id}", response_model=UserRead)
def get_user_by_id(user_id: int, session: SessionDep):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return build_user_read(user)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def create_user(user_credentials: UserRegister, session: SessionDep):
    statement = select(User).where(User.phone == user_credentials.phone)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone No. is already registered")

    if user_credentials.email:
        email_stmt = select(User).where(User.email == user_credentials.email)
        existing_email = session.exec(email_stmt).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    firstname = user_credentials.firstname
    lastname = user_credentials.lastname
    if not firstname and user_credentials.name:
        parts = user_credentials.name.strip().split(" ", 1)
        firstname = parts[0]
        lastname = parts[1] if len(parts) > 1 else None

    if not is_strong_password(user_credentials.password):
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail="Password is not strong!")

    user = User(
        phone=user_credentials.phone,
        email=user_credentials.email,
        password=hash(user_credentials.password),
        firstname=firstname,
        lastname=lastname,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "Successfully registered", "user": build_user_read(user)}


@router.post("/register-admin", status_code=status.HTTP_201_CREATED)
def create_admin(session: SessionDep, admin_credentials: AdminRegister, current_admin: User = Depends(require_admin)):
    statement = select(User).where(User.phone == admin_credentials.phone)
    existing_admin = session.exec(statement).first()

    if existing_admin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone No. is already registered")

    if admin_credentials.email:
        email_stmt = select(User).where(User.email == admin_credentials.email)
        existing_email = session.exec(email_stmt).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    if not is_strong_password(admin_credentials.password):
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail="Password is not strong!")

    admin = User(
        phone=admin_credentials.phone,
        email=admin_credentials.email,
        password=hash(admin_credentials.password),
        is_admin=True,
    )

    session.add(admin)
    session.commit()
    session.refresh(admin)

    return {"message": "Admin Registered successfully", "user": build_user_read(admin)}