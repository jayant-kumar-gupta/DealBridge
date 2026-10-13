# DealBridge 

DealBridge is a high-performance, full-stack e-commerce deal discovery and price comparison platform. It aggregates partner offers across major retailers, computes platform-exclusive negotiated deals, and enables a seamless shopping journey with interactive analytics.

The platform is built with **FastAPI (Python)** on the backend, **PostgreSQL with SQLModel** for relational data persistence, and **Vanilla HTML5, CSS3, and JavaScript (ES Modules)** on the frontend.

---

## 🚀 Tech Stack

- **Backend:** FastAPI, SQLModel (SQLAlchemy ORM), Pydantic v2, PostgreSQL, `pwdlib` (Argon2 / Bcrypt), PyJWT, `secrets`.
- **Frontend:** Vanilla HTML5, CSS3 (Custom CSS variables, dark mode support, responsive grid/flexbox), Vanilla JavaScript (ES Modules, Async/Await Fetch API, Canvas 2D API for charts).
- **Architecture:** Layered REST API (`/api/v1`), JWT Bearer Token Authentication, Background Task Execution.

---

## ⚙️ Getting Started & How to Run

Follow these steps to set up and run DealBridge locally on your machine.

### Prerequisites

- **Python 3.10+** (Python 3.12+ recommended)
- **PostgreSQL** installed and running locally
- **Git**

---

### Step 1: Clone the Repository & Navigate to Project

```bash
git clone https://github.com/your-username/DealBridge.git
cd DealBridge
```

---

### Step 2: Create and Activate a Virtual Environment

```bash
# On Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# On Windows:
python -m venv .venv
.venv\Scripts\activate
```

---

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 4: Configure Environment Variables

Create a `.env` file in the project root (you can base it on the template below):

```env
PROJECT_NAME="DealBridge API"
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/dealbridge_db"
SECRET_KEY="your-super-secret-jwt-key-here"

# Admin Credentials (Optional / Seed)
EMAIL="admin.dealbridge@gmail.com"
ADMIN_PASSWORD="YourStrongPassword123!"
```

> **Note:** Ensure a PostgreSQL database named `dealbridge_db` (or whatever you specify in `DATABASE_URL`) exists on your PostgreSQL server:
> ```sql
> CREATE DATABASE dealbridge_db;
> ```

---

### Step 5: Start the Server

Run the development server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

When the server starts:
- The `lifespan` handler automatically creates all required database tables if they do not exist.
- FastAPI serves both the REST API endpoints and all static frontend assets (HTML, CSS, JS, images).

---

### Step 6: Access the Application

- **Frontend Website:** [http://localhost:8000/](http://localhost:8000/)
- **Interactive API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative API Documentation (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠️ What Has Been Built Till Now

### 1. Authentication & Security
- **JWT Authentication:** OAuth2 password flow issuing JSON Web Tokens stored securely in the browser.
- **Role-Based Access Control (RBAC):** Admin vs. Customer permissions on sensitive endpoints (product mutations, admin registration).
- **Password Security:** Password hashing via `pwdlib` and strict password complexity validation (uppercase, lowercase, numeric, special characters, minimum length).
- **OTP Password Reset Pipeline:**
  - Cryptographically secure 6-digit OTP generation via Python's `secrets` module.
  - Asynchronous dispatch using FastAPI `BackgroundTasks` (non-blocking SMS/email delivery).
  - Secure storage using hashed OTPs in PostgreSQL (`OTPVerification`).
  - Brute-force protection with max 5 failed attempts per OTP before automatic invalidation.
  - Expiration enforcement (10-minute validity window).
  - Atomic password reset via `PUT /api/v1/login/reset-password`.

### 2. Product Catalog & Data Modeling
- **Relational Schema:** Clean normalization across `Category`, `Product`, `Partner`, `PartnerPrice`, `ProductSpec`, `Tag`, `ProductTag`, and `ProductPriceHistory`.
- **Pre-Seeded Catalog:** 24 comprehensive products complete with brands, categories, high-resolution images, technical specifications, and searchable tags.
- **Multi-Partner Pricing:** Products linked to multiple retail partners with live stock tracking and distinct retail rates.
- **Deal Calculation Engine:** Dynamic calculation of `our_deal` pricing based on the lowest partner rate with platform discount rules.

### 3. Price Analytics & Visual Trends
- **Price History Tracking:** Composite primary key `(product_id, partner_id, date)` recording multi-partner historical fluctuations over 1–6 months.
- **Canvas Price Trend Chart:** Native HTML5 Canvas line graph on the product detail page with time-range toggles (1M, 6M, 1Y), min/max stats, and interactive visual indicators.

### 4. Interactive Ratings, Reviews & Wishlist
- **Product Ratings:** User-submitted ratings updating rolling average rating (`avg_rating`) and total rating counts.
- **Discussion & Comments:** Community review section with authentication prompts and BOLA/IDOR protection (users can only delete their own comments).
- **Wishlist:** Interactive client-side wishlist management with real-time state synchronization across product cards and detail views.

### 5. Cart, Addresses & Order Checkout
- **Cart Management:** Persistent shopping cart with quantity adjustments and partner-specific item bindings.
- **Address Book:** Customer shipping addresses with default address designation.
- **Snapshot Order Architecture:** Checkout flow capturing exact item snapshot prices (`OrderItem`), stock decrementing, and promo code redemption.

---

## 🔮 Future Roadmap & Upcoming Features

### 1. Bulk Product Ingestion Endpoint (`POST /api/v1/products/bulk-upload`)
- **Admin File Uploads:** Ingesting large-scale e-commerce datasets (e.g. Kaggle Flipkart/Amazon datasets) directly into the database.
- **Streaming Ingestion:** Leveraging FastAPI `UploadFile` and Python's in-memory `csv.DictReader` to stream and parse thousands of products without memory spikes.
- **Automated Entity Resolution:** Auto-mapping categories, auto-generating slugs, and returning detailed row-by-row validation reports.

### 2. Live Partner-Seller Comparison & Multi-Seller Checkout
*(Replacing the "Partner-Sellers feature coming soon" section on `product.html`)*
- **Direct Partner Price Comparison:** A live comparison table showcasing real-time prices across all verified retail partners for that product.
- **Multi-Seller Fulfillment:** Allowing buyers to select which specific partner fulfills their order, unlocking specific partner warranty and delivery terms.
- **Direct Savings Highlighting:** Dynamic side-by-side comparison showing exact monetary savings against competitor retail prices.

### 3. Production Readiness & DevOps
- **Alembic Database Migrations:** Replacing ad-hoc table updates with version-controlled database migration scripts.
- **Dockerization:** Complete `Dockerfile` and `docker-compose.yml` orchestrating FastAPI and PostgreSQL in isolated containers.
- **Redis In-Memory Caching:** Offloading short-lived OTP tokens and caching high-traffic catalog queries to eliminate repeated database reads.
- **Automated Testing Suite:** End-to-end integration and unit tests using `pytest` and `httpx`.
