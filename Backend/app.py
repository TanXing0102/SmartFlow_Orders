from flask import Flask, request, jsonify
from flask_cors import CORS

from Services.planner import generate_plan
from Services.bundler import build_bundle
from Services.smart_swap import optimize_cart
from Utils.helpers import calculate_total
from Services.zai_agent import call_zai

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/")
def home():
    return {"message": "SmartFlow Orders AI Backend Running"}


@app.route("/build-cart", methods=["POST"])
def build_cart():
    data = request.get_json(silent=True)

    if not data or "prompt" not in data:
        return jsonify({"error": "Missing prompt"}), 400

    user_input = data["prompt"]

    try:
        # -------------------------
        # 1. PLAN
        # -------------------------
        plan = generate_plan(user_input)
        categories = plan.get("categories", [])
        budget = plan.get("budget", 500)

        # 🚨 CATEGORY NOT SUPPORTED
        if not categories:
            return jsonify({
                "plan": plan,
                "cart": [],
                "total": 0,
                "status": "not_found",
                "ai_explanation": "We do not support this product category."
            })

        # -------------------------
        # 2. BUILD CART
        # -------------------------
        cart = build_bundle(categories)

        # 🚨 EMPTY CART
        if not cart:
            return jsonify({
                "plan": plan,
                "cart": [],
                "total": 0,
                "status": "not_found",
                "ai_explanation": "Sorry, this product is not available in our system."
            })

        # -------------------------
        # 3. OPTIMIZE
        # -------------------------
        cart, status = optimize_cart(cart, budget)
        total = calculate_total(cart)

        # -------------------------
        # 4. AI EXPLANATION (STRICT)
        # -------------------------
        ai_response = call_zai([
            {
                "role": "system",
                "content": (
                    "You are a shopping assistant. "
                    "ONLY explain items in the cart. "
                    "DO NOT suggest new products."
                )
            },
            {
                "role": "user",
                "content": f"Cart: {cart}, Budget: {budget}, Status: {status}"
            }
        ])

        explanation = "AI unavailable"

        if isinstance(ai_response, dict) and ai_response.get("choices"):
            try:
                explanation = ai_response["choices"][0]["message"]["content"]
            except:
                explanation = "AI parsing error"

        return jsonify({
            "plan": plan,
            "cart": cart,
            "total": total,
            "status": status,
            "ai_explanation": explanation
        })

    except Exception as e:
        print("SERVER ERROR:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)