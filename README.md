<p align="center">
  <img src="assets/images/logo.jpg" alt="DealBridge Logo" width="80" />
</p>

<h1 align="center">DealBridge</h1>

<p align="center">
  <strong>Smarter Choices, Better Products</strong><br/>
  A full-stack e-commerce price comparison platform that aggregates partner offers, computes platform-exclusive deals, and delivers a seamless shopping experience.
</p>

<p align="center">
  <a href="https://dealbridge-9aa9.onrender.com">🌐 Live Demo</a> &nbsp;·&nbsp;
  <a href="#-features">✨ Features</a> &nbsp;·&nbsp;
  <a href="#%EF%B8%8F-getting-started">⚙️ Setup Guide</a> &nbsp;·&nbsp;
  <a href="#-seeding-the-database">🌱 Seed Data</a> &nbsp;·&nbsp;
  <a href="#-api-documentation">📖 API Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/Deployed_on-Render-46E3B7?logo=render&logoColor=white" alt="Render" />
</p>

---

## 📸 Screenshots

| Homepage | Product Page |
|----------|-------------|
| ![Homepage](assets/screenshots/homepage.png) | ![Product Page](assets/screenshots/product-page.png) |

---

## ✨ Features

### 🛒 Shopping Experience
- **Smart Price Comparison** — Compare prices across multiple retail partners on a single product page
- **Deal Calculation Engine** — Automatically computes the best deal based on the lowest partner rate
- **Product Catalog** — Browse 50,000+ products organized across 248 categories with search, filters, and brand grouping
- **Price History Charts** — Interactive Canvas-based line charts showing historical price trends (1M / 6M / 1Y toggles)

### 🔐 Authentication & Security
- **JWT Authentication** — OAuth2-based login with secure JSON Web Tokens
- **OTP Verification** — 6-digit OTP generation for registration and password reset (demo mode shows OTP in the UI)
- **Role-Based Access Control** — Admin vs Customer permissions on sensitive endpoints
- **Password Security** — Argon2 password hashing with strict complexity validation

### 🛍️ Cart & Checkout
- **Persistent Shopping Cart** — Add/remove items with quantity adjustments
- **Address Management** — Save multiple shipping addresses with default selection
- **Order Snapshots** — Checkout captures exact item prices at the time of purchase
- **Payment Validation** — Server-side total verification with floating-point tolerance

### ⭐ Ratings & Community
- **Product Ratings** — Submit ratings that update a rolling average
- **Reviews & Comments** — Community discussion with authentication-protected posting
- **Wishlist** — Save favorite products with real-time state sync across pages

### 🔧 Admin Dashboard
- Manage categories, products, partners, prices, users, orders, and reviews from a dedicated admin panel

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI · SQLModel (SQLAlchemy ORM) · Pydantic v2 · PyJWT · pwdlib (Argon2) |
| **Database** | PostgreSQL · Alembic (migrations) |
| **Frontend** | Vanilla HTML5 · CSS3 (custom properties, dark theme) · JavaScript ES Modules |
| **Deployment** | Render (web service) · Supabase (managed PostgreSQL) · Gunicorn |

---

## ⚙️ Getting Started

Follow these steps to set up DealBridge locally on your machine.

### Prerequisites

| Tool | Purpose |
|------|---------|
| **Python 3.10+** | Runtime (3.12+ recommended) |
| **PostgreSQL 14+** | Database engine |
| **pgAdmin 4** *(optional)* | GUI for managing PostgreSQL |
| **Git** | Version control |

---

### Step 1 — Install PostgreSQL & pgAdmin

#### On Ubuntu / Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### On Windows / macOS:
Download and install from [postgresql.org/download](https://www.postgresql.org/download/). The installer includes pgAdmin.

For pgAdmin separately: [pgadmin.org/download](https://www.pgadmin.org/download/)

---

### Step 2 — Create a PostgreSQL User and Database

Open a terminal and switch to the PostgreSQL shell:

```bash
sudo -u postgres psql
```

Run the following SQL commands to create a dedicated user and database:

```sql
-- 1. Create a new user with a password
CREATE USER dealbridge_user WITH PASSWORD 'your_strong_password';

-- 2. Create the database
CREATE DATABASE dealbridge_db;

-- 3. Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE dealbridge_db TO dealbridge_user;

-- 4. Connect to the database and grant schema permissions
\c dealbridge_db
GRANT ALL ON SCHEMA public TO dealbridge_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dealbridge_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dealbridge_user;

-- 5. Exit
\q
```

> **💡 Tip:** If using **pgAdmin**, you can do the same via the GUI:
> 1. Right-click **Login/Group Roles** → **Create** → **Login/Group Role** → set name and password under the **Definition** tab, enable **Can login?** under **Privileges**
> 2. Right-click **Databases** → **Create** → **Database** → set name, set Owner to the user you created
> 3. The owner automatically gets full privileges on the database

---

### Step 3 — Clone the Repository

```bash
git clone https://github.com/jayant-kumar-gupta/DealBridge.git
cd DealBridge
```

---

### Step 4 — Create & Activate Virtual Environment

```bash
# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

---

### Step 5 — Install Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 6 — Create the `.env` File

Create a file named `.env` in the project root with the following variables:

```env
PROJECT_NAME="DealBridge API"
DATABASE_URL="postgresql+psycopg2://dealbridge_user:your_strong_password@localhost:5432/dealbridge_db"
SECRET_KEY="generate-a-long-random-secret-key-here"

# Admin credentials (used to create the first admin account)
EMAIL="admin@dealbridge.com"
ADMIN_PASSWORD="YourAdminPassword123!"
```

> **⚠️ Important:**
> - Replace `dealbridge_user` and `your_strong_password` with the PostgreSQL user and password you created in Step 2.
> - Generate a strong `SECRET_KEY` — you can use: `python -c "import secrets; print(secrets.token_hex(32))"`
> - The `ADMIN_PASSWORD` must contain: uppercase, lowercase, number, and special character (minimum 8 characters).

---

### Step 7 — Start the Server

```bash
uvicorn app.main:app --reload
```

On startup, the **lifespan handler** automatically creates all required database tables.

---

### Step 8 — Access the Application

| Service | URL |
|---------|-----|
| 🌐 **Frontend Website** | [http://localhost:8000](http://localhost:8000) |
| 📖 **Swagger API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| 📋 **ReDoc API Docs** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| ❤️ **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) |

---

## 🌱 Seeding the Database

DealBridge ships with an **Amazon product dataset** located in the [`Amazon-product-dataset/`](Amazon-product-dataset/) folder:

| File | Records | Description |
|------|---------|-------------|
| `amazon_categories.csv` | 248 | Product categories with icons |
| `amazon_products_50k.csv` | 50,000 | Products with titles, images, brands, prices |
| `amazon_products_400k.csv` | 400,000 | Extended dataset (same schema) |

### Seed Steps

The seeding endpoints are **admin-only** and use the Swagger UI for file uploads.

#### 1. Register & Login as Admin

1. Open the website at [http://localhost:8000](http://localhost:8000)
2. Click **Register** and create an account using the **email** and **password** from your `.env` file (`EMAIL` and `ADMIN_PASSWORD`)
3. Complete the OTP verification (in demo mode, the OTP is displayed on the screen)
4. Log in with the admin credentials

#### 2. Get Your Auth Token

1. Open [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
2. Click the **🔒 Authorize** button (top right)
3. Enter your admin email and password → click **Authorize**

#### 3. Seed Categories (must be done first)

1. In Swagger UI, find **Seed Database** → `POST /api/v1/seed/l-file-categories`
2. Click **Try it out**
3. Upload `Amazon-product-dataset/amazon_categories.csv`
4. Click **Execute**
5. Expected response: `"insert_count": 248`

#### 4. Seed Products

1. Find `POST /api/v1/seed/l-file-products`
2. Upload `Amazon-product-dataset/amazon_products_50k.csv`
3. Click **Execute**
4. Expected response: `"insert_count": ~47027` (rows with invalid `category_id` are skipped)

> **📝 Note:** You can use `amazon_products_400k.csv` instead for a larger catalog. The endpoint processes rows in batches of 2,000 for memory efficiency.

#### 5. Seed Partner Prices (Amazon)

Before seeding partner prices, you need at least one partner in the database. The dataset is configured to use **partner ID 6** (Amazon).

1. In Swagger UI, find **Partners** → `POST /api/v1/partners/` and create a partner:
   ```json
   {
     "name": "Amazon",
     "badge_color": "#FF9900",
     "website_url": "https://www.amazon.com"
   }
   ```
   Repeat this for as many partners as you need (the 6th partner created will have `id: 6`).

   Alternatively, create 6 partners so the IDs align:
   | # | Name | Badge Color | Website |
   |---|------|------------|---------|
   | 1 | MegaMart | `#E74C3C` | `https://megamart.com` |
   | 2 | QuickShop | `#3498DB` | `https://quickshop.com` |
   | 3 | PrimeDeals | `#2ECC71` | `https://primedeals.com` |
   | 4 | ValueStore | `#F39C12` | `https://valuestore.com` |
   | 5 | TechBay | `#9B59B6` | `https://techbay.com` |
   | 6 | Amazon | `#FF9900` | `https://amazon.com` |

2. Find `POST /api/v1/seed/l-file-partner-price-amazon`
3. Upload `Amazon-product-dataset/amazon_products_50k.csv` (the same file — it contains price data)
4. Click **Execute**
5. Expected response: partner prices inserted for all seeded products

> **💡 Tip:** If the upload times out (large files over slow connections), simply re-upload the same file. The endpoint automatically skips already-inserted records and picks up where it left off.

---

## 📖 API Documentation

DealBridge exposes a RESTful API under the `/api/v1` prefix. All endpoints are fully documented and testable via:

- **Swagger UI** → [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc** → [http://localhost:8000/redoc](http://localhost:8000/redoc)

### API Endpoint Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Auth | `/api/v1/login`, `/api/v1/register` | Registration, login, OTP, password reset |
| Categories | `/api/v1/categories` | CRUD for product categories |
| Products | `/api/v1/products` | Product catalog, search, filtering |
| Partners | `/api/v1/partners` | Retail partner management |
| Partner Prices | `/api/v1/partner-price` | Multi-partner pricing per product |
| Ratings & Reviews | `/api/v1/ratings` | Ratings, comments, reviews |
| Cart | `/api/v1/cart` | Shopping cart operations |
| Orders | `/api/v1/orders` | Checkout, order history |
| Addresses | `/api/v1/addresses` | Shipping address management |
| Tags | `/api/v1/tags` | Product tagging |
| Price History | `/api/v1/price-history` | Historical price tracking |
| Seed Database | `/api/v1/seed` | Bulk data import (admin only) |

---

## 📁 Project Structure

```
DealBridge/
├── app/
│   ├── main.py                 # FastAPI app, middleware, router registration
│   ├── api/v1/endpoints/       # All API route handlers
│   │   ├── user_auth.py        # Auth, login, registration, OTP
│   │   ├── categories.py       # Category CRUD
│   │   ├── products.py         # Product CRUD + search
│   │   ├── partners.py         # Partner management
│   │   ├── partner_price.py    # Partner pricing
│   │   ├── orders.py           # Checkout + order management
│   │   ├── seed_database.py    # Bulk CSV import endpoints
│   │   └── ...                 # ratings, carts, addresses, tags, etc.
│   ├── core/
│   │   ├── config.py           # Pydantic settings (reads .env)
│   │   ├── database.py         # SQLModel engine + session
│   │   └── utils.py            # Shared utilities
│   ├── models/
│   │   └── database.py         # All SQLModel table definitions
│   └── schemas/                # Pydantic request/response schemas
├── js/
│   ├── components/             # Reusable UI components (header, footer, toast, modal)
│   ├── pages/                  # Page-specific logic (home, product, cart, checkout)
│   ├── state/                  # Client-side state management (auth, cart, wishlist)
│   └── utils/                  # API client, helpers, router
├── css/                        # Stylesheets (variables, base, components, responsive)
├── admin/                      # Admin dashboard HTML pages
├── assets/
│   ├── images/                 # Logo and static images
│   └── screenshots/            # README screenshots
├── Amazon-product-dataset/     # CSV datasets for seeding
│   ├── amazon_categories.csv   # 248 categories
│   ├── amazon_products_50k.csv # 50K products
│   └── amazon_products_400k.csv# 400K products
├── alembic/                    # Database migration scripts
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (not committed)
├── .gitignore
├── LICENSE                     # MIT License
└── README.md
```

---

## 🌐 Live Demo

The project is deployed and accessible at:

### 🔗 **[https://dealbridge-9aa9.onrender.com](https://dealbridge-9aa9.onrender.com)**

> **📝 Note:** The app is hosted on Render's free tier. The first request may take 30–60 seconds as the server spins up from a cold start.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**© 2026 Jayant Kumar Gupta**
