from fastapi import FastAPI
from app.core.database import create_db_and_tables
from contextlib import asynccontextmanager
from app.api.v1.endpoints import categories, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs before the app starts accepting requests
    create_db_and_tables()
    yield
    # Code here runs when the app is shutting down (clean up)

app = FastAPI(lifespan=lifespan)

app.include_router(categories.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    '''Health check endpoint to verify backend status.'''
    return {"status": "healthy", "service": "DealBridge API", "version":"1.0.0"}