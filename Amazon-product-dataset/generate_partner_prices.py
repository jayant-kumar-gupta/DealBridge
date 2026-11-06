import csv
import random
from datetime import datetime, timezone, timedelta

random.seed(42)

INPUT  = "/home/jayant/Documents/DealBridge/Amazon-product-dataset/amazon_products_50k.csv"
OUTPUT_COMBINED = "/home/jayant/Documents/DealBridge/Amazon-product-dataset/amazon_products_partner_prices.csv"
OUTPUT_AMAZON = "/home/jayant/Documents/DealBridge/Amazon-product-dataset/product_price_history_amazon.csv"
OUTPUT_PRIMEDEALS = "/home/jayant/Documents/DealBridge/Amazon-product-dataset/product_price_history_primedeals.csv"

# Current UTC time reference: ISO-8601 (YYYY-MM-DDTHH:MM:SSZ)
NOW = datetime.now(timezone.utc).replace(microsecond=0)

fields_combined = ["id", "amazon_price", "primedeals_price", "amazon_date", "primedeals_date"]
fields_history = ["product_id", "date", "partner_id", "price"]

with open(INPUT, newline="", encoding="utf-8") as fin, \
     open(OUTPUT_COMBINED, "w", newline="", encoding="utf-8") as fcomb, \
     open(OUTPUT_AMAZON, "w", newline="", encoding="utf-8") as famz, \
     open(OUTPUT_PRIMEDEALS, "w", newline="", encoding="utf-8") as fprime:

    reader = csv.DictReader(fin)
    w_comb = csv.DictWriter(fcomb, fieldnames=fields_combined)
    w_amz = csv.DictWriter(famz, fieldnames=fields_history)
    w_prime = csv.DictWriter(fprime, fieldnames=fields_history)

    w_comb.writeheader()
    w_amz.writeheader()
    w_prime.writeheader()

    for row in reader:
        pid = row["id"].strip()
        try:
            orig_price = float(row["price"].strip())
        except (ValueError, KeyError):
            orig_price = 0.0

        # Convert USD to INR by multiplying by 95
        if orig_price > 0:
            base_price = round(orig_price * 95, 2)
        else:
            base_price = round(random.uniform(8.0, 30.0) * 95, 2)

        # 3 distinct dates spanning across 12 months (1Y, 6M, 1M ranges)
        d1_days = random.randint(210, 350)
        d2_days = random.randint(45, 180)
        d3_days = random.randint(1, 28)

        for days_ago in [d1_days, d2_days, d3_days]:
            dt = NOW - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
            date_str = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            fluctuation = random.uniform(0.94, 1.06)
            amazon_price = round(base_price * fluctuation, 2)

            markup = random.uniform(1.00, 1.14)
            primedeals_price = round(amazon_price * markup, 2)
            if primedeals_price < amazon_price:
                primedeals_price = amazon_price

            w_comb.writerow({
                "id": pid,
                "amazon_price": amazon_price,
                "primedeals_price": primedeals_price,
                "amazon_date": date_str,
                "primedeals_date": date_str,
            })

            w_amz.writerow({
                "product_id": pid,
                "date": date_str,
                "partner_id": 6,
                "price": amazon_price,
            })

            w_prime.writerow({
                "product_id": pid,
                "date": date_str,
                "partner_id": 3,
                "price": primedeals_price,
            })

print("Done – generated all CSV datasets in INR (USD * 95).")
