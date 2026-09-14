from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select
from app.schemas.users import UserRegister, UserLoginResponse, AdminRegister, Token
from app.core.database import SessionDep
from app.models.database import Users
from app.core.utils import hash, verify, create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/login", tags=["Login & Authentication"])

def require_admin(current_user: Token = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to access this page.")

    return current_user


@router.post("/", response_model=UserLoginResponse)
def user_login(session: SessionDep,
               user_credentials: OAuth2PasswordRequestForm = Depends(),
            ):
    statement = select(Users).where((Users.email == user_credentials.username) | (Users.phone == user_credentials.username))
    database_user = session.exec(statement).first()

    if not database_user or not verify(user_credentials.password, database_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")

    access_token = create_access_token({"user_id":database_user.id,
                                        "user_email":database_user.email,
                                        "role": "admin" if database_user.is_admin else "user",
                                    })
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def create_user(user_credentials: UserRegister, session: SessionDep):
    # 1. Quick Database check first
    statement = select(Users).where(Users.phone == user_credentials.phone)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone No. is already registered")

    # 2. Only hash if email is unique
    user = Users(
            phone=user_credentials.phone,
            email=user_credentials.email,
            password=hash(user_credentials.password),
            firstname=user_credentials.firstname,
            lastname=user_credentials.lastname,
        )
    
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message" : "Successfully registered"}

@router.post("/register-admin", status_code=status.HTTP_201_CREATED)
def create_admin(session: SessionDep, admin_credentials: AdminRegister, current_admin: Token = Depends(require_admin)):
    statement = select(Users).where(Users.phone == admin_credentials.phone)
    existing_admin = session.exec(statement).first()

    if existing_admin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone No. is already registered")

    admin = Users(
        phone = admin_credentials.phone,
        email=admin_credentials.email,
        password = hash(admin_credentials.password),
        is_admin = True,
    )

    session.add(admin)
    session.commit()
    session.refresh(admin)

    return {"message": "Admin Registered successfully"}