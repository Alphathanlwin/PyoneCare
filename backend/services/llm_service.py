import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)


class LLMServiceUnavailableError(Exception):
    """Raised when the LLM API cannot be reached, errors, is unconfigured, or
    returns a response the caller can't use."""


class LLMService:
    """Thin wrapper around an OpenAI-compatible chat completions API.

    Any OpenAI-compatible provider (OpenAI, Groq, OpenRouter, etc.) works by
    just pointing LLM_API_URL / LLM_MODEL / LLM_API_KEY at it — callers never
    touch the HTTP shape directly.
    """

    async def complete(
        self,
        *,
        system_prompt: str,
        user_message: str,
        history: list[dict] | None = None,
        temperature: float = 0.0,
        max_tokens: int = 500,
    ) -> str:
        """Returns the assistant's reply text for a system + optional history + user turn.

        `history` is an already-validated list of {"role", "content"} dicts
        (prior user/assistant turns) inserted between the system prompt and the
        latest user message so multi-turn chats keep context.

        Raises LLMServiceUnavailableError if no API key is configured or on
        any network/API/parsing failure, so callers can surface a consistent
        503 instead of leaking provider-specific errors.
        """
        if not settings.LLM_API_KEY:
            raise LLMServiceUnavailableError()

        headers = {"Authorization": f"Bearer {settings.LLM_API_KEY}"}
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": user_message})
        payload = {
            "model": settings.LLM_MODEL,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": messages,
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(settings.LLM_API_URL, headers=headers, json=payload)
                response.raise_for_status()
                body = response.json()
                return body["choices"][0]["message"]["content"]
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
            logger.warning("LLM service unavailable: %s", exc)
            raise LLMServiceUnavailableError() from exc
