import logging

import httpx


class UpstreamUnavailableError(Exception):
    """Raised when any upstream HTTP API cannot be reached, errors, or is unconfigured."""


async def post_json(
    url: str,
    *,
    headers: dict,
    payload: dict,
    timeout: float,
    logger: logging.Logger,
    op: str,
) -> httpx.Response:
    """POSTs JSON and returns the response. Raises UpstreamUnavailableError on network failure."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            return await client.post(url, headers=headers, json=payload)
    except httpx.HTTPError:
        logger.exception("%s: network error calling %s", op, url)
        raise UpstreamUnavailableError()
