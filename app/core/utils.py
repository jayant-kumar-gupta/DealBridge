from pwdlib import PasswordHash
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from app.schemas.users import Token
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv

load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/")

SECRET_KEY = os.getenv("SECRET_KEY")
ACCESS_TOKEN_EXPIRATION = 30
ALGORITHM = "HS256"

def hash(password: str):
    hashed = PasswordHash.recommended().hash(password)
    return hashed

def verify(password1, password2):
    return PasswordHash.recommended().verify(password1, password2)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRATION)

    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_access_token(token: str, credential_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")

        if user_id is None:
            raise credential_exception
        
        token_data = Token(user_id=user_id, role=role)
        return token_data
    except InvalidTokenError:
        raise credential_exception

def get_current_user(token: str = Depends(oauth2_scheme)):
    credential_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credential not validated.", headers={"WWW-Authenticate": "Bearer"})

    return verify_access_token(token, credential_exception)