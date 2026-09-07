from sqlmodel import create_engine, SQLModel, Session
from typing import Annotated
from fastapi import Depends

DATABASE_URL = "postgresql://jayant:Gentleman_123@localhost:5432/dealbridge_db"
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]