from fastapi import FastAPI
from app.core.database import create_db_and_tables
from contextlib import asynccontextmanager
from app.api.v1.endpoints import categories, user_auth, products, partners, partner_price
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs before the app starts accepting requests
    create_db_and_tables()
    yield
    # Code here runs when the app is shutting down (clean up)

app = FastAPI(lifespan=lifespan)

app.mount(
    "/assets",
    StaticFiles(directory="assets"),
    name="assets",
)

app.include_router(categories.router, prefix="/api/v1")
app.include_router(user_auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(partners.router, prefix="/api/v1")
app.include_router(partner_price.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    '''Health check endpoint to verify backend status.'''
    return {"status": "healthy", "service": "DealBridge API", "version":"1.0.0"}