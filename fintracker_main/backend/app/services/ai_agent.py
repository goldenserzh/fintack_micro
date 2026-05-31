import os
import asyncio
from typing import List, Dict, Any

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

_generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "max_output_tokens": 2048,
}


def _get_genai():
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        return genai
    except ImportError:
        raise RuntimeError("Пакет google-generativeai не установлен. Выполните: pip install google-generativeai")


def _build_system_prompt(user_name: str, profile: dict, transactions: List[dict]) -> str:
    profile_block = ""
    if profile:
        profile_block = f"""
Финансовый профиль:
- Ежемесячный доход: {profile.get('income', 0):,.0f} ₽
- Месячный лимит расходов: {profile.get('limit', 0):,.0f} ₽
- Финансовая цель: {profile.get('goal', 'не указана')}
- Целевая сумма накоплений: {f"{profile.get('goal_amount', 0):,.0f} ₽" if profile.get('goal_amount') else 'не указана'}"""

    tx_lines = []
    for tx in transactions[-30:]:
        tx_lines.append(f"  • {tx['name']} — {tx['amount']:,.0f} ₽ [{tx['category']}] ({tx['created_at'][:10]})")
    tx_block = "\n".join(tx_lines) if tx_lines else "  Транзакций нет"

    return f"""Ты финансовый ИИ-ассистент приложения FinTracker. Помогаешь пользователю {user_name} управлять личными финансами.
{profile_block}

Последние транзакции (до 30):
{tx_block}

Правила:
- Отвечай только на том языке, на котором написан промт
- Давай конкретные, практичные советы основываясь на реальных данных пользователя
- Если данных недостаточно — скажи об этом и попроси уточнить
- Будь лаконичен, но информативен
- Не используй markdown-заголовки с # — только обычный текст и списки с •"""


def _build_model(genai, system_prompt: str):
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=_generation_config,
        system_instruction=system_prompt,
    )


def _build_gemini_history(history: List[Dict[str, str]]) -> list:
    result = []
    for entry in history:
        role = "model" if entry["role"] == "assistant" else "user"
        result.append({"role": role, "parts": [entry["content"]]})
    return result


async def get_ai_reply_async(
    user_name: str,
    profile: dict,
    transactions: List[dict],
    message: str,
    history: List[Dict[str, str]],
) -> str:
    genai = _get_genai()
    system_prompt = _build_system_prompt(user_name, profile, transactions)
    model = _build_model(genai, system_prompt)
    gemini_history = _build_gemini_history(history)

    chat = model.start_chat(history=gemini_history)

    # Run blocking SDK call in thread pool so FastAPI stays non-blocking
    response = await asyncio.to_thread(chat.send_message, message)
    return response.text
