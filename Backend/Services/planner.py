import json
from Services.zai_agent import call_zai


def generate_plan(user_input):
    messages = [
        {
            "role": "system",
            "content": """
You are a STRICT shopping intent parser.

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown

Format:
{
  "categories": ["camera"],
  "budget": 500
}

Allowed categories:
camera, mic, tripod, lighting, laptop

If not relevant:
- categories = []

If no budget:
- budget = null
"""
        },
        {
            "role": "user",
            "content": user_input
        }
    ]

    response = call_zai(messages)

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

    try:
        parsed = json.loads(content)

        if "categories" not in parsed:
            parsed["categories"] = infer_categories(user_input)

        if "budget" not in parsed:
            parsed["budget"] = infer_budget(user_input)

        return parsed

    except:
        return fallback_plan(user_input)


# -------------------------
# FALLBACK
# -------------------------
def fallback_plan(user_input):
    return {
        "categories": infer_categories(user_input),
        "budget": infer_budget(user_input)
    }


def infer_categories(text):
    text = text.lower()
    categories = []

    if any(w in text for w in ["camera", "dslr"]):
        categories.append("camera")
    if any(w in text for w in ["mic", "microphone"]):
        categories.append("mic")
    if "tripod" in text:
        categories.append("tripod")
    if any(w in text for w in ["light", "lighting"]):
        categories.append("lighting")
    if any(w in text for w in ["laptop", "notebook"]):
        categories.append("laptop")

    return categories  # 🚨 NO DEFAULT


def infer_budget(text):
    import re

    numbers = re.findall(r"\d+", text)
    if numbers:
        return int(numbers[0])

    if "cheap" in text:
        return 300
    if "pro" in text:
        return 1500

    return None