from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select
from app.schemas.users import UserRegister, UserLoginResponse, AdminRegister, Token
from app.core.database import SessionDep
from app.models.database import Users, Admins
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
    # Checks if admin tries to login
    admin_user = session.exec(select(Admins).where(Admins.email == user_credentials.username)).first()

    if admin_user:
        if not verify(user_credentials.password, admin_user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
        access_token = create_access_token({"user_id":admin_user.id,
                                            "user_email":admin_user.email,
                                            "role": "admin",
                                        })
    else: # Runs when user tries to login
        statement = select(Users).where(Users.email == user_credentials.username)
        database_user = session.exec(statement).first()

        if not database_user or not verify(user_credentials.password, database_user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")

        access_token = create_access_token({"user_id":database_user.id,
                                            "user_email":database_user.email,
                                            "role": "user",
                                        })
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def create_user(user_credentials: UserRegister, session: SessionDep):
    # 1. Quick Database check first
    statement = select(Users).where(Users.email == user_credentials.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    # 2. Only hash if email is unique
    user = Users(
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
    statement = select(Admins).where(Admins.email == admin_credentials.email)
    existing_admin = session.exec(statement).first()

    if existing_admin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    admin = Admins(
        email = admin_credentials.email,
        password = hash(admin_credentials.password),
    )

    session.add(admin)
    session.commit()
    session.refresh(admin)

    return {"message": "Admin Registered successfully"}