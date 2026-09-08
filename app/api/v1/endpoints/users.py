from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
from app.schemas.users import UserRegister, UserLoginResponse
from app.core.database import SessionDep
from app.models.database import Users
from app.core.utils import hash, verify, create_access_token
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/login", tags=["Login & Authentication"])

@router.post("/", response_model=UserLoginResponse)
def user_login(user_credentials: OAuth2PasswordRequestForm, session: SessionDep):
    statement = select(Users).where(Users.email == user_credentials.username)
    database_user = session.exec(statement).first()

    if not database_user or not verify(user_credentials.password, database_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")

    access_token = create_access_token({"user_id":database_user.id,
                                        "user_email":database_user.email,
                                    })
    return {"jwt_token" : access_token}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def create_user(user_credentials: UserRegister, session: SessionDep):
    user = Users(
        email=user_credentials.email,
        password=hash(user_credentials.password),
        firstname=user_credentials.firstname,
        lastname=user_credentials.lastname,
    )
    statement = select(Users).where(Users.email == user.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message" : "Successfully registered"}