import google.generativeai as genai
from google.generativeai import types
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HELICONE_API_KEY = os.getenv("HELICONE_API_KEY")

def query_gemini(prompt: str):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }
    data = {
        "contents": [{
                "parts": [
                    {"text": prompt}
                ]}]}
    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]
    else:
        raise ValueError(
            f"Error querying Gemini: {response.status_code} - {response.text}"
        )

def query_gemini_via_helicone(prompt: str):
    """
    Sends a prompt to the Gemini model via Helicone proxy and returns the response.
    """

    url = "https://google.helicone.ai/v1beta/models/gemini-2.5-flash-lite:generateContent"

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,              # ✅ correct Gemini authentication
        "Helicone-Auth": f"Bearer {HELICONE_API_KEY}", # ✅ still use Bearer for Helicone
        "Content-Type": "application/json",
    }

    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]
    else:
        raise ValueError(
            f"Error querying Gemini via Helicone: {response.status_code} - {response.text}"
        )