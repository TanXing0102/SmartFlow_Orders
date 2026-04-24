import requests
import time
from config import ZAI_API_KEY, ZAI_URL, MODEL


def call_zai(messages):
    headers = {
        "Authorization": f"Bearer {ZAI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.2
    }

    # 🔁 RETRY LOGIC ADDED HERE
    for attempt in range(3):  # try 3 times
        try:
            response = requests.post(
                ZAI_URL,
                headers=headers,
                json=payload,
                timeout=120  # increase timeout
            )

            print(f"Attempt {attempt+1} status:", response.status_code)

            # ❗ handle Cloudflare HTML error
            if "text/html" in response.headers.get("Content-Type", ""):
                print("HTML error detected, retrying...")
                time.sleep(2)
                continue

            # success
            if response.status_code == 200:
                return response.json()

            # 504 or other server error
            print("Server error:", response.text)
            time.sleep(2)

        except requests.exceptions.Timeout:
            print("Timeout, retrying...")
            time.sleep(2)

        except Exception as e:
            print("Error:", e)
            time.sleep(2)

    # ❌ after all retries fail
    return {
        "error": "AI failed after 3 attempts"
    }