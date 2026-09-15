import logging

from config import settings
from utils.http import UpstreamUnavailableError, post_json

logger = logging.getLogger(__name__)

LLMServiceUnavailableError = UpstreamUnavailableError


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
        temperature: float = 0.0,
        max_tokens: int = 500,
    ) -> str:
        """Returns the assistant's reply text for a system + user turn.

        Raises LLMServiceUnavailableError if no API key is configured or on
        any network/API/parsing failure, so callers can surface a consistent
        503 instead of leaking provider-specific errors.
        """
        if not settings.LLM_API_KEY:
            raise LLMServiceUnavailableError()

        headers = {"Authorization": f"Bearer {settings.LLM_API_KEY}"}
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        payload = {
            "model": settings.LLM_MODEL,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": messages,
        }

        try:
            response = await post_json(
                settings.LLM_API_URL,
                headers=headers,
                payload=payload,
                timeout=20.0,
                logger=logger,
                op="LLM request",
            )
        except UpstreamUnavailableError:
            raise LLMServiceUnavailableError()

        if response.status_code >= 400:
            logger.error(
                "LLM request failed: HTTP %s from %s (model=%s) — body: %s",
                response.status_code,
                settings.LLM_API_URL,
                settings.LLM_MODEL,
                response.text[:2000],
            )
            raise LLMServiceUnavailableError()

        try:
            return response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError):
            logger.exception(
                "LLM request failed: unexpected response shape — body: %s",
                response.text[:2000],
            )
            raise LLMServiceUnavailableError()
