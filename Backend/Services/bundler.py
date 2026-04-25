from Utils.helpers import load_products


def build_bundle(categories, preference=None):
    products = load_products()
    cart = []

    for cat in categories:
        # Fix: stock is boolean true/false in JSON, not a number
        items = [
            p for p in products
            if p["category"] == cat and p.get("stock") is True
        ]

        if not items:
            continue

        if preference == "cheaper":
            # Pick the cheapest available
            best = sorted(items, key=lambda x: x["price"])[0]
        elif preference == "premium":
            # Pick the most expensive (best tier)
            best = sorted(items, key=lambda x: x["price"], reverse=True)[0]
        else:
            # Default: pick the cheapest
            best = sorted(items, key=lambda x: x["price"])[0]

        cart.append(best)

    return cart