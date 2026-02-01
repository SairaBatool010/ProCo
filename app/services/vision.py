from __future__ import annotations

import os
from typing import Tuple

import httpx

DEFAULT_PROMPT = (
    "Describe this image in detail. If it shows damage or a maintenance issue, "
    "describe what is damaged, severity, and any visible details that would help "
    "a repair technician."
)


def analyze_image(image_base64: str, prompt: str | None = None) -> str:
    model_choice = (os.getenv("VISION_MODEL") or "gpt4o").lower()
    prompt_text = prompt or DEFAULT_PROMPT

    if model_choice in {"gpt4o", "openai"}:
        return _analyze_with_openai(image_base64, prompt_text)
    if model_choice == "gemini":
        return _analyze_with_gemini(image_base64, prompt_text)

    raise RuntimeError(f"Unsupported VISION_MODEL: {model_choice}")


def _split_data_url(image_base64: str) -> Tuple[str, str]:
    if image_base64.startswith("data:"):
        header, data = image_base64.split(",", 1)
        mime = header.split(";")[0].replace("data:", "")
        return mime, data
    return "image/jpeg", image_base64


def _analyze_with_openai(image_base64: str, prompt: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    model = os.getenv("OPENAI_VISION_MODEL") or "gpt-4o-mini"
    data_url = image_base64
    if not image_base64.startswith("data:"):
        data_url = f"data:image/jpeg;base64,{image_base64}"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "temperature": 0.2,
    }

    with httpx.Client(timeout=20) as client:
        response = client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
    response.raise_for_status()
    data = response.json()
    return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()


def _analyze_with_gemini(image_base64: str, prompt: str) -> str:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set")

    model = os.getenv("GEMINI_VISION_MODEL") or "gemini-1.5-flash"
    mime, data = _split_data_url(image_base64)

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime, "data": data}},
                ]
            }
        ]
    }

    with httpx.Client(timeout=20) as client:
        response = client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            json=payload,
        )
    response.raise_for_status()
    data = response.json()
    return (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    ).strip()
