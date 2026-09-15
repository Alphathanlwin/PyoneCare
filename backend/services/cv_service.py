import base64
import logging

import httpx

from config import settings
from utils.http import UpstreamUnavailableError

logger = logging.getLogger(__name__)

CANDIDATE_LABELS = [
    "healthy teeth",
    "tooth discoloration",
    "visible dark spot",
    "swollen gums",
    "mouth sore",
    "white lesion",
    "broken tooth",
]

CV_LABEL_TO_SYMPTOM = {
    "tooth discoloration": "yellow_staining",
    "visible dark spot": "black_spot",
    "swollen gums": "swollen_gums",
    "mouth sore": "mouth_ulcer",
    "white lesion": "white_spot",
    "broken tooth": "broken_tooth",
}

CONFIDENCE_THRESHOLD = 0.6


class CVServiceUnavailableError(UpstreamUnavailableError):
    """Raised when the HuggingFace Inference API cannot be reached or errors."""


class CVService:
    async def analyze(self, image_bytes: bytes) -> list[dict]:
        """Calls the HuggingFace zero-shot image classifier on the given photo.

        Raises CVServiceUnavailableError on any network/API failure so callers
        can fall back to a symptom-only assessment instead of failing the request.
        """
        b64 = base64.b64encode(image_bytes).decode()
        headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}"}
        payload = {"inputs": b64, "parameters": {"candidate_labels": CANDIDATE_LABELS}}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    settings.HUGGINGFACE_MODEL_URL, headers=headers, json=payload
                )
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("HuggingFace CV service unavailable: %s", exc)
            raise CVServiceUnavailableError() from exc

    def extract_symptoms(self, cv_response: list[dict]) -> list[str]:
        """Maps CV labels at or above the confidence threshold to symptom keys."""
        if not isinstance(cv_response, list):
            return []

        detected = []
        for item in cv_response:
            label = item.get("label")
            score = item.get("score", 0)
            if score >= CONFIDENCE_THRESHOLD and label in CV_LABEL_TO_SYMPTOM:
                detected.append(CV_LABEL_TO_SYMPTOM[label])
        return detected
