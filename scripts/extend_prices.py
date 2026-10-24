#!/usr/bin/env python3
"""Add $40, $50, and $100 weekly baskets from published unit prices, and mark guides as weekly."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRICES = ROOT / "data" / "prices.json"

def thousandths(value):
    parts = str(value).split(".")
    whole = int(parts[0] or "0")
    frac = (parts[1] if len(parts) > 1 else "").ljust(3, "0")[:3]
    return whole * 1000 + int(frac)

def price_string(total):
    return f"{total // 1000}.{total % 1000:03d}"

def multiply(base, n):
    total = thousandths(base["price"]) * n
    price = price_string(total)
    item = json.loads(json.dumps(base))
    item["price"] = price
    item.pop("reason", None)
    en = base["name"]["en"].replace("1 dozen", f"{n} dozen").replace("1 lb", f"{n} lb").replace("1 kg", f"{n} kg")
    fr = base["name"]["fr"].replace("1 douzaine", f"{n} douzaines").replace("1 lb", f"{n} lb").replace("1 kg", f"{n} kg")
    es = base["name"]["es"].replace("1 docena", f"{n} docenas").replace("1 lb", f"{n} lb").replace("1 kg", f"{n} kg")
    if "1 lb" not in base["name"]["en"] and "1 dozen" not in base["name"]["en"] and "1 kg" not in base["name"]["en"]:
        en = base["name"]["en"] + f" × {n}"
        fr = base["name"]["fr"] + f" × {n}"
        es = base["name"]["es"] + f" × {n}"
    unit_en = base["price"]
    unit_fr = base["price"].replace(".", ",")
    item["name"] = {
        "en": f"{en} ({n} × ${unit_en})",
        "fr": f"{fr} ({n} × {unit_fr} $)",
        "es": f"{es} ({n} × ${unit_en})",
    }
    item["calc"] = f"{n} × {base['price']} = {price}"
    item["estimated"] = False
    return item

def ensure(items, base_id, n):
    if n == 1:
        return base_id
    new_id = f"{base_id}_{n}"
    if new_id not in items:
        items[new_id] = multiply(items[base_id], n)
    return new_id

def tier_total(items, ids):
    return sum(thousandths(items[i]["price"]) for i in ids)

def main():
    data = json.loads(PRICES.read_text())
    data["checked"] = "2026-10-23"
    data["about"] = (
        "Canada prices are Statistics Canada table 18-10-0245-01, Canada average, August 2026. "
        "United States prices are Bureau of Labor Statistics CPI average prices, U.S. city average, September 2026. "
        "Mexico prices are Profeco Quién es Quién en los Precios observations for Mexico City, October 2026. "
        "Every amount is one week of shopping, not one day. "
        "A line that is part of a published package, or a whole number of pounds, keeps the published rate. "
        "No price was lowered to fit a cap."
    )
    countries = data["countries"]

    ca = countries["CA"]
    moved = {
        "White rice, 2 kg": "ca_rice",
        "Peanut butter, 1 kg": "ca_pb",
        "Onions, 1.36 kg": "ca_onions",
        "Dry or fresh pasta, 500 g": "ca_pasta",
        "Pasta sauce, 650 ml": "ca_sauce",
        "Cereal, 400 g": "ca_cereal",
    }
    kept = []
    for entry in ca["confirmedNotListed"]:
        new_id = moved.get(entry["name"]["en"])
        if new_id:
            item = json.loads(json.dumps(entry))
            item.pop("reason", None)
            ca["items"][new_id] = item
        else:
            if entry["name"]["en"].startswith("Brown rice"):
                entry["reason"] = (
                    "A different product from the white rice on the $50 and $100 weekly lists. "
                    "It is not swapped in. The price was not cut."
                )
            kept.append(entry)
    ca["confirmedNotListed"] = kept

    def ca_tier(spec):
        return [ensure(ca["items"], base, n) for base, n in spec]

    ca40 = ca_tier([
        ("ca_lentils", 2), ("ca_beans", 2), ("ca_cabbage", 2), ("ca_spinach", 2),
        ("ca_carrots", 1), ("ca_tomatoes", 1), ("ca_eggs", 1), ("ca_bread", 1),
        ("ca_bananas", 1), ("ca_oil", 1),
    ])
    ca50 = ca_tier([
        ("ca_rice", 1), ("ca_lentils", 2), ("ca_beans", 2), ("ca_cabbage", 2), ("ca_spinach", 2),
        ("ca_carrots", 1), ("ca_tomatoes", 1), ("ca_eggs", 1), ("ca_bread", 1),
        ("ca_bananas", 1), ("ca_oil", 2),
    ])
    ca100 = ca_tier([
        ("ca_rice", 1), ("ca_lentils", 3), ("ca_beans", 3), ("ca_cabbage", 3), ("ca_spinach", 3),
        ("ca_carrots", 2), ("ca_tomatoes", 2), ("ca_eggs", 2), ("ca_bread", 2),
        ("ca_bananas", 2), ("ca_oil", 3), ("ca_onions", 1), ("ca_pasta", 1),
        ("ca_sauce", 1), ("ca_pb", 1), ("ca_cereal", 1),
    ])
    ca["tiers"]["40"] = ca40
    ca["tiers"]["50"] = ca50
    ca["tiers"]["100"] = ca100
    ca["budgets"] = [5, 10, 15, 20, 25, 30, 40, 50, 100]

    us = countries["US"]
    def us_tier(spec):
        return [ensure(us["items"], base, n) for base, n in spec]

    us40 = us_tier([
        ("us_potatoes", 3), ("us_lettuce", 1), ("us_bananas", 2), ("us_beans", 2),
        ("us_eggs", 2), ("us_rice", 3), ("us_pasta", 3), ("us_bread", 3),
        ("us_tomatoes", 1), ("us_flour", 2), ("us_chicken", 3), ("us_oranges", 2),
    ])
    us50 = us_tier([
        ("us_potatoes", 4), ("us_lettuce", 2), ("us_bananas", 3), ("us_beans", 3),
        ("us_eggs", 2), ("us_rice", 4), ("us_pasta", 3), ("us_bread", 3),
        ("us_tomatoes", 2), ("us_flour", 3), ("us_chicken", 3), ("us_oranges", 3),
    ])
    us100 = us_tier([
        ("us_potatoes", 8), ("us_lettuce", 4), ("us_bananas", 6), ("us_beans", 6),
        ("us_eggs", 4), ("us_rice", 8), ("us_pasta", 6), ("us_bread", 6),
        ("us_tomatoes", 4), ("us_flour", 6), ("us_chicken", 6), ("us_oranges", 6),
    ])
    us["tiers"]["40"] = us40
    us["tiers"]["50"] = us50
    us["tiers"]["100"] = us100
    us["budgets"] = [5, 10, 15, 20, 25, 30, 40, 50, 100]
    for entry in us["confirmedNotListed"]:
        if entry["name"]["en"].startswith("White sugar"):
            entry["reason"] = (
                "A pound is $1.019. Added to the $50 weekly list it would pass $50, "
                "and added to the $100 weekly list it would pass $100. The price was not cut."
            )

    checks = {
        "CA": {"40": 40000, "50": 50000, "100": 100000},
        "US": {"40": 40000, "50": 50000, "100": 100000},
    }
    for region, caps in checks.items():
        items = countries[region]["items"]
        for budget, cap in caps.items():
            total = tier_total(items, countries[region]["tiers"][budget])
            print(region, budget, price_string(total), "OK" if total <= cap else "OVER")
            if total > cap:
                raise SystemExit(1)
    for region in ("CA", "US", "MX"):
        items = countries[region]["items"]
        for budget, ids in countries[region]["tiers"].items():
            total = tier_total(items, ids)
            if total > int(budget) * 1000:
                print("EXISTING OVER", region, budget, price_string(total))
                raise SystemExit(1)

    PRICES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("wrote", PRICES)

FLAGS = {
    "fr": "Chaque montant sur cette page couvre sept jours, une semaine d'épicerie, pas une journée.",
    "es": "Cada monto en esta página cubre siete días, una semana de compras, no un día.",
    "en": "Every amount on this page is for seven days, one week of groceries, not one day.",
}

def flag_guides():
    count = 0
    for path in ROOT.glob("**/*.html"):
        if path.name == "404.html" or path.parent.name in {"about", "a-propos", "acerca", "privacy", "confidentialite", "privacidad"}:
            continue
        text = path.read_text()
        if 'class="guide"' not in text or 'class="week-flag"' in text:
            continue
        lang = "en"
        if 'lang="fr' in text[:200]:
            lang = "fr"
        elif 'lang="es' in text[:200]:
            lang = "es"
        paragraph = f'<p class="week-flag">{FLAGS[lang]}</p>\n'
        if "</h1>" not in text:
            continue
        text = text.replace("</h1>", "</h1>\n" + paragraph, 1)
        path.write_text(text)
        count += 1
    print("flagged", count)

if __name__ == "__main__":
    main()
    flag_guides()
