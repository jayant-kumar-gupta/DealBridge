from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_db_and_tables
from contextlib import asynccontextmanager
from app.api.v1.endpoints import categories, user_auth, products, partners, partner_price, ratings_reviews, carts, orders, addresses, product_spec, tags, product_tags, price_history, seed_database
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs before the app starts accepting requests
    create_db_and_tables()
    yield
    # Code here runs when the app is shutting down (clean up)

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify exact domains like ["https://dealbridge.com"]
    allow_credentials=True, # Allows cookies and Authorization headers
    allow_methods=["*"], # Allows all standard HTTP methods: GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"], # Allows all request headers (e.g. Content-Type, Authorization)
)

@app.middleware("http")
async def disable_cache_for_static(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

app.include_router(categories.router, prefix="/api/v1")
app.include_router(user_auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(partners.router, prefix="/api/v1")
app.include_router(partner_price.router, prefix="/api/v1")
app.include_router(ratings_reviews.router, prefix="/api/v1")
app.include_router(carts.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(addresses.router, prefix="/api/v1")
app.include_router(product_spec.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")
app.include_router(product_tags.router, prefix="/api/v1")
app.include_router(price_history.router, prefix="/api/v1")
app.include_router(seed_database.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    '''Health check endpoint to verify backend status.'''
    return {"status": "healthy", "service": "DealBridge API", "version":"1.0.0"}

app.mount(
    "/",
    StaticFiles(directory=".", html=True),
    name="static",
)