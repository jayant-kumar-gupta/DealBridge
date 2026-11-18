import csv
import io
from fastapi import APIRouter, Depends, UploadFile
from slugify import slugify
from sqlalchemy import text
from sqlmodel import select
from app.core.database import SessionDep
from app.core.utils import require_admin
from app.models.database import Category, PartnerPrice, Product, User

router = APIRouter(prefix="/seed", tags=["Seed Database"])

DEFAULT_SEEDED_STOCK = 50


def _reset_postgres_sequence(session: SessionDep, table_name: str) -> None:
    bind = session.get_bind()
    if bind is not None and bind.dialect.name == "postgresql":
        session.exec(
            text(
                f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM \"{table_name}\"), 1), true)"
            )
        )
        session.commit()


# Seed Categories
@router.post("/l-file-categories")
def seed_categories_by_file(
    file: UploadFile,
    session: SessionDep,
    current_user: User = Depends(require_admin),
):
    contents = file.file.read()
    decoded_content = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded_content))

    # Fetch all existing category IDs in ONE single query
    existing_ids = set(session.exec(select(Category.id)).all())

    count = 0  # Counts the number of insertions in database
    skipped = 0  # Counts number of skipped rows
    for row in reader:
        cat_id = int(row["id"])

        if cat_id in existing_ids:
            skipped += 1
            continue

        category = Category(
            id=cat_id,
            name=row["category_name"],
            icon=row["icon"],
            slug=slugify(row["category_name"]),
        )
        session.add(category)
        existing_ids.add(cat_id)
        count += 1

    session.commit()
    _reset_postgres_sequence(session, "category")
    return {"message": "Categories uploaded successfully", "insert_count": count, "skipped": skipped}


# Seed Products
@router.post("/l-file-products")
def seed_products_by_file(
    file: UploadFile,
    session: SessionDep,
    current_user: User = Depends(require_admin),
):
    session.expire_on_commit = False  # Prevents SQLModel from expiring objects on commit
    contents = file.file.read()
    decoded_content = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded_content))

    existing_ids = set(session.exec(select(Product.id)).all())
    existing_category_ids = set(session.exec(select(Category.id)).all())
    category_counts: dict[int, int] = {}

    count = 0
    skipped = 0
    for row in reader:
        product_id = int(row["id"])
        if product_id in existing_ids:
            skipped += 1
            continue

        cat_id = int(row["category_id"])
        if cat_id not in existing_category_ids:
            skipped += 1
            continue

        product = Product(
            id=product_id,
            name=row["title"],
            image_path=row["imgUrl"],
            category_id=cat_id,
            slug=slugify(row["title"]),
            brand=row["brand"] if row["brand"] else None,
        )
        session.add(product)
        existing_ids.add(product_id)
        category_counts[cat_id] = category_counts.get(cat_id, 0) + 1
        count += 1

        # Batch commit to reduce memory overhead and save time
        if count % 2000 == 0:
            session.commit()
            session.expunge_all()

    session.commit()

    # Sync category product_count for newly seeded products
    if category_counts:
        for cat_id, delta in category_counts.items():
            cat = session.get(Category, cat_id)
            if cat:
                cat.product_count = (cat.product_count or 0) + delta
                session.add(cat)
        session.commit()

    _reset_postgres_sequence(session, "product")
    return {"message": "Products uploaded successfully", "insert_count": count, "skipped": skipped}


# Seed Product price for partner #Amazon
@router.post("/l-file-partner-price-amazon")
def seed_partner_price_amazon(
    file: UploadFile,
    session: SessionDep,
    current_user: User = Depends(require_admin),
):
    session.expire_on_commit = False  # Prevents SQLModel from expiring products_map on session.commit()
    contents = file.file.read()
    decoded_content = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded_content))

    partner_id = 6
    # Pre-fetch all products' price as a dictionary {product_id: our_deal}
    products_price_map = dict(session.exec(select(Product.id, Product.our_deal)).all())

    # Pre-fetch all already existing products in partner price table
    existing_product_ids = set(
        session.exec(select(PartnerPrice.product_id).where(PartnerPrice.partner_id == partner_id)).all()
    )

    count = 0
    skipped = 0
    for row in reader:
        product_id = int(row["id"])
        if product_id not in products_price_map or product_id in existing_product_ids:
            skipped += 1
            continue

        price = float(row["price"]) * 95
        marked_price = float(row["listPrice"]) * 95 if row.get("listPrice") and row["listPrice"].strip() else None

        partner_price = PartnerPrice(
            product_id=product_id,
            partner_id=partner_id,
            partner_price=price,
            marked_price=marked_price,
            stock_count=DEFAULT_SEEDED_STOCK,
            partner_product_url=row["productURL"],
        )

        session.add(partner_price)
        existing_product_ids.add(product_id)

        # Update the product 'our_deal' in memory (no extra DB queries) for valid positive prices
        current_product_price = products_price_map.get(product_id)
        if price > 0 and (current_product_price is None or current_product_price <= 0 or price < current_product_price):
            products_price_map[product_id] = price
            product = session.get(Product, product_id)
            if product:
                product.our_deal = price
                product.marked_price = marked_price
                session.add(product)
        count += 1

        # Batch commit to reduce memory overhead and save time
        if count % 2000 == 0:
            session.commit()
            session.expunge_all()  # Clears the 2000 committed objects from RAM

    session.commit()
    return {"message": "Partner Price uploaded successfully", "insert_count": count, "skipped": skipped}
