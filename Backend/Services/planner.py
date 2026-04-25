import json
import re
from Services.zai_agent import call_zai


ALLOWED_CATEGORIES = [
    "camera", "mic", "tripod", "lighting",
    "laptop", "gpu", "cpu", "ram", "storage",
    "motherboard", "psu", "case", "cooling",
    "monitor", "keyboard", "mouse", "headset",
    "desk", "chair", "hub", "networking",
    "tablet", "ups", "accessories"
]


def generate_plan(user_input, current_cart=None):
    categories_list = ", ".join(ALLOWED_CATEGORIES)

    messages = [
        {
            "role": "system",
            "content": f"""
You are a STRICT shopping intent parser.

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown

Format:
{{
  "categories": ["camera", "mic"],
  "budget": 500,
  "preference": "cheaper"
}}

Allowed categories (use exact names):
{categories_list}

For "preference":
- If user wants cheaper/budget/lower price → "cheaper"
- If user wants better/premium/upgrade → "premium"
- Otherwise → null

If the user says "cheaper", "lower budget", "less expensive", or similar WITHOUT specifying new categories,
AND you are given a current_cart, keep the same categories from the cart.

If no budget mentioned → budget = null
If no preference → preference = null
If not relevant to any category → categories = []
"""
        },
        {
            "role": "user",
            "content": f"User request: {user_input}\nCurrent cart categories: {[i['category'] for i in current_cart] if current_cart else []}"
        }
    ]

    response = call_zai(messages)

    if not isinstance(response, dict) or "error" in response:
        return fallback_plan(user_input, current_cart)

    content = None
    if response.get("choices"):
        try:
            content = response["choices"][0]["message"]["content"]
        except:
            return fallback_plan(user_input, current_cart)

    if not content:
        return fallback_plan(user_input, current_cart)

    try:
        parsed = json.loads(content)

        # If AI returned empty categories but user was asking for cheaper/premium,
        # preserve current cart categories
        if not parsed.get("categories") and current_cart:
            parsed["categories"] = list({item["category"] for item in current_cart})

        if "categories" not in parsed or not parsed["categories"]:
            parsed["categories"] = infer_categories(user_input, current_cart)

        if not parsed.get("budget"):
            parsed["budget"] = infer_budget(user_input)

        if not parsed.get("preference"):
            parsed["preference"] = infer_preference(user_input)

        return parsed

    except:
        return fallback_plan(user_input, current_cart)


def fallback_plan(user_input, current_cart=None):
    return {
        "categories": infer_categories(user_input, current_cart),
        "budget": infer_budget(user_input),
        "preference": infer_preference(user_input)
    }


def infer_preference(text):
    text = text.lower()
    if any(w in text for w in ["cheap", "cheaper", "budget", "lower", "less expensive", "affordable"]):
        return "cheaper"
    if any(w in text for w in ["better", "premium", "upgrade", "higher", "best", "pro"]):
        return "premium"
    return None


def infer_categories(text, current_cart=None):
    text = text.lower()

    # If the user is just asking for cheaper/premium with no new items mentioned,
    # and we have a current cart, keep those categories
    preference_only = any(w in text for w in [
        "cheap", "cheaper", "budget", "lower", "less", "affordable",
        "better", "premium", "upgrade", "higher", "best"
    ])
    specific_item = any(w in text for w in ALLOWED_CATEGORIES + [
        "pc", "computer", "gaming", "office", "workstation",
        "keyboard", "mouse", "screen", "display", "headphone",
        "standing desk", "webcam", "dslr", "notebook"
    ])

    if preference_only and not specific_item and current_cart:
        return list({item["category"] for item in current_cart})

    categories = []

    keyword_map = {
        "camera":      ["camera", "dslr", "webcam"],
        "mic":         ["mic", "microphone"],
        "tripod":      ["tripod"],
        "lighting":    ["light", "lighting", "ring light"],
        "laptop":      ["laptop", "notebook"],
        "gpu":         ["gpu", "graphics card", "video card"],
        "cpu":         ["cpu", "processor"],
        "ram":         ["ram", "memory"],
        "storage":     ["storage", "ssd", "hdd", "hard drive", "nvme"],
        "motherboard": ["motherboard", "mobo"],
        "psu":         ["psu", "power supply"],
        "case":        ["case", "chassis", "tower"],
        "cooling":     ["cooler", "cooling", "aio", "fan"],
        "monitor":     ["monitor", "screen", "display"],
        "keyboard":    ["keyboard"],
        "mouse":       ["mouse"],
        "headset":     ["headset", "headphone", "earphone"],
        "desk":        ["desk", "standing desk", "table"],
        "chair":       ["chair", "seat"],
        "hub":         ["hub", "dock", "usb hub"],
        "networking":  ["router", "wifi", "ethernet", "network"],
        "tablet":      ["tablet", "drawing tablet", "pen display"],
        "ups":         ["ups", "uninterruptible"],
        "accessories": ["webcam", "desk mat", "cable", "monitor arm", "laptop stand"],
    }

    # Preset bundles
    if any(w in text for w in ["gaming pc", "gaming computer", "gaming build"]):
        return ["gpu", "cpu", "ram", "storage", "motherboard", "psu", "case", "cooling", "monitor", "keyboard", "mouse", "headset"]

    if any(w in text for w in ["home office", "office setup"]):
        return ["monitor", "keyboard", "mouse", "desk", "chair", "webcam", "hub", "ups"]

    if any(w in text for w in ["developer workstation", "dev setup", "coding setup"]):
        return ["monitor", "keyboard", "mouse", "laptop", "hub", "chair", "desk"]

    if any(w in text for w in ["content creator", "youtube setup", "streaming setup"]):
        return ["camera", "mic", "lighting", "tripod", "monitor", "headset"]

    for cat, keywords in keyword_map.items():
        if any(kw in text for kw in keywords):
            categories.append(cat)

    return categories


def infer_budget(text):
    numbers = re.findall(r"\d+", text)
    if numbers:
        candidates = [int(n) for n in numbers if int(n) >= 50]
        if candidates:
            return max(candidates)

    text_lower = text.lower()
    if any(w in text_lower for w in ["cheap", "budget", "affordable"]):
        return 500
    if "pro" in text_lower or "premium" in text_lower:
        return 5000

    return None