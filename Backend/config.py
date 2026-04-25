import os
from dotenv import load_dotenv

load_dotenv()

ZAI_API_KEY = os.getenv("ZAI_API_KEY")
ZAI_URL = "https://api.ilmu.ai/v1/chat/completions"
MODEL = "ilmu-glm-5.1"