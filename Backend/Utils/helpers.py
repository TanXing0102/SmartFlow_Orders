import json

def load_products():
    with open("data/products.json", "r") as f:
        return json.load(f)

def calculate_total(cart):
    return sum(item["price"] for item in cart)