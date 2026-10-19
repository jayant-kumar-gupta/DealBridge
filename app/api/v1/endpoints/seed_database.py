from fastapi import APIRouter, Depends, UploadFile
import csv
import io
from slugify import slugify
from sqlmodel import select
from .user_auth import require_admin
from app.core.database import SessionDep
from app.models.database import User, Category, Product, PartnerPrice
from app.api.v1.endpoints.partner_price import sync_product_table

router = APIRouter(prefix="/seed", tags=["Seed Database"])

# Seed Categories
@router.post("/l-file-categories")
async def seed_categories_by_file(file: UploadFile, session: SessionDep,current_user: User = Depends(require_admin)):
    contents = await file.read()
    decoded_content = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded_content))
    count = 0 # Counts the number of insertions in database
    skipped = 0 # Counts number of failed insertions
    for row in reader:
        cat_name = row["category_name"].strip()
        existing = session.exec(select(Category).where(Category.name == cat_name)).first()
        if existing:
            skipped += 1
            continue
        category = Category(
            name=row["category_name"],
            icon = row["icon"],
            slug=slugify(row["category_name"]),
        )
        session.add(category)
        count += 1

    session.commit()
    return {"message": "Categories uploaded successfully", "insert_count": count, "skipped": skipped}


# Seed Products
@router.post("l-file-categories")
async def seed_products_by_file(file: UploadFile, session: SessionDep, current_user: User = Depends(require_admin)):
    contents = await file.read()
    decoded_content = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded_content))
    count = 0
    skipped = 0
    for row in reader:
        product_id = int(row["id"])
        existing = session.get(Product, product_id)
        if existing:
            skipped += 1
            continue
        if int(row["category_id"]) > 248:
            skipped +=1
            continue

        product = Product(
            id = int(row["id"]),
            name = row["title"],
            image_path = row["imgUrl"],
            category_id = int(row["category_id"]),
            slug = slugify(row["title"]),
            brand=row["brand"] if row["brand"] else None,
        )
        session.add(product)
        count += 1

    session.commit()
    return {"message": "Products uploaded successfully", "insert_count": count, "skipped": skipped}

# Seed Product price for partner #Amazon
@router.post("l-file-partner-price-amazon")
async def seed_partner_price_amazon(file: UploadFile, session: SessionDep, current_user: User = Depends(require_admin)):
    contents = await file.read()
    decoded_content = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded_content))
    count = 0
    skipped = 0
    partner_id = 6
    for row in reader:
        product_id = int(row["id"])
        existing_product = session.get(Product, product_id)
        if not existing_product:
            skipped += 1
            continue

        existing_partner_price = session.get(PartnerPrice, (existing_product.id, partner_id))
        if existing_partner_price:
            skipped += 1
            continue

        partner_price = PartnerPrice(
            product_id = existing_product.id,
            partner_id = partner_id,
            partner_price = float(row["price"]) * 95,
            marked_price = float(row["listPrice"]) * 95,
            partner_product_url = row["productURL"],
        )

        session.add(partner_price)
        session.flush()
        sync_product_table(session, existing_product.id)
        count += 1

    session.commit()
    return {"message": "Partner Price uploaded successfully", "insert_count": count, "skipped": skipped}