import os
import json
import asyncio

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

CATEGORIES = ["food", "transport", "entertainment", "shopping", "health", "other"]

_PARSE_PROMPT = """You are a financial transaction parser. Extract expense transactions from the input.

Return ONLY a valid JSON array, no markdown fences, no explanation:
[{"name": "Short name max 30 chars", "amount": 123.45, "category": "food"}, ...]

Valid categories (pick the best match):
- food: cafes, restaurants, groceries, supermarkets, food delivery
- transport: fuel/petrol, taxi, metro, bus, parking, car repair
- entertainment: games, cinema, streaming, bars, clubs, events
- shopping: clothing, electronics, household goods, online shopping
- health: pharmacy, doctors, dentist, gym, fitness
- other: utilities, services, transfers, everything else

Rules:
- Amount must be a positive number (expenses only, skip income/transfers)
- Name in the same language as the input, max 30 characters
- If multiple items are listed, create one transaction per item
- If no transactions found, return []"""


def _get_model(system_instruction: str):
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        return genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config={"temperature": 0.1, "max_output_tokens": 1024},
        )
    except ImportError:
        raise RuntimeError("google-generativeai не установлен")


def _parse_json(raw: str) -> list[dict]:
    text = raw.strip()
    if "```" in text:
        for block in text.split("```"):
            block = block.strip().lstrip("json").strip()
            if block.startswith("["):
                text = block
                break

    start, end = text.find("["), text.rfind("]")
    if start == -1 or end == -1:
        return []

    try:
        data = json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return []

    result = []
    for item in (data if isinstance(data, list) else []):
        name = str(item.get("name", ""))[:30].strip()
        try:
            amount = round(float(item.get("amount", 0)), 2)
        except (TypeError, ValueError):
            continue
        category = str(item.get("category", "other")).lower().strip()
        if category not in CATEGORIES:
            category = "other"
        if name and amount > 0:
            result.append({"name": name, "amount": amount, "category": category})
    return result


def _parse_text_sync(text: str) -> list[dict]:
    model = _get_model(_PARSE_PROMPT)
    response = model.generate_content(f"Extract transactions from:\n\n{text}")
    return _parse_json(response.text)


def _parse_image_sync(image_bytes: bytes, mime_type: str) -> list[dict]:
    model = _get_model(_PARSE_PROMPT)
    image_part = {"mime_type": mime_type, "data": image_bytes}
    response = model.generate_content(
        [image_part, "Extract all items and prices from this receipt."]
    )
    return _parse_json(response.text)


async def parse_text_to_transactions(text: str) -> list[dict]:
    return await asyncio.to_thread(_parse_text_sync, text)


async def parse_image_to_transactions(image_bytes: bytes, mime_type: str) -> list[dict]:
    return await asyncio.to_thread(_parse_image_sync, image_bytes, mime_type)
