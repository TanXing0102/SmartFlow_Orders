import json
from Services.zai_agent import call_zai


def generate_plan(user_input):
    messages = [
        {
            "role": "system",
            "content": """
You are a strict shopping intent extraction engine.

Return ONLY JSON:
{
  "categories": ["camera"],
  "budget": 500
}
"""
        },
        {
            "role": "user",
            "content": user_input
        }
    ]

    response = call_zai(messages)

    print("RAW AI RESPONSE:", response)

    # -------------------------
    # Fallback if AI fails
    # -------------------------
    if not isinstance(response, dict) or "error" in response:
        return fallback_plan(user_input)

    content = None

    if response.get("choices"):
        try:
            content = response["choices"][0]["message"]["content"]
        except:
            return fallback_plan(user_input)

    if not content:
        return fallback_plan(user_input)

    # -------------------------
    # Parse AI JSON safely
    # -------------------------
    try:
        parsed = json.loads(content)

        if not parsed.get("categories"):
            parsed["categories"] = infer_categories(user_input)

        if not parsed.get("budget"):
            parsed["budget"] = infer_budget(user_input)

        return parsed

    except:
        return fallback_plan(user_input)


# -------------------------
# FALLBACK SYSTEM (IMPORTANT)
# -------------------------
def fallback_plan(user_input):
    return {
        "categories": infer_categories(user_input),
        "budget": infer_budget(user_input)
    }


def infer_categories(text):
    text = text.lower()
    categories = []

    if "camera" in text:
        categories.append("camera")
    if "mic" in text:
        categories.append("mic")
    if "tripod" in text:
        categories.append("tripod")
    if "light" in text:
        categories.append("lighting")
    if "laptop" in text:
        categories.append("laptop")

    return categories if categories else ["camera"]


def infer_budget(text):
    import re

    numbers = re.findall(r"\d+", text)
    if numbers:
        return int(numbers[0])

    if "cheap" in text:
        return 300
    if "pro" in text:
        return 1500

    return 500