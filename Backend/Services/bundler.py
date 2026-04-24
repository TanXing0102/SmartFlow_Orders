from Utils.helpers import load_products

def build_bundle(categories):
    products = load_products()
    cart = []

    for cat in categories:
        items = [p for p in products if p["category"] == cat and p["stock"]]

        if items:
            best = sorted(items, key=lambda x: x["price"])[0]
            cart.append(best)

    return cart