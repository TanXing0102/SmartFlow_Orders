from Utils.helpers import calculate_total, load_products


def optimize_cart(cart, budget):
    if not budget:
        return cart, "No budget"

    total = calculate_total(cart)

    if total <= budget:
        return cart, "Within budget"

    products = load_products()

    for i, item in enumerate(cart):
        cheaper = [
            p for p in products
            if p["category"] == item["category"]
            and p["price"] < item["price"]
            and p.get("stock", 0) > 0
        ]

        if cheaper:
            cart[i] = sorted(cheaper, key=lambda x: x["price"])[0]

            if calculate_total(cart) <= budget:
                return cart, "Optimized"

    return cart, "Best effort"