import base64
import binascii
import io
import uuid
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from exceptions import ImageTooLargeException, InvalidImageFormatException

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MIN_IMAGE_DIMENSION_PX = 100
ALLOWED_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}


def decode_base64_image(photo_base64: str) -> bytes:
    """Decodes a base64 photo payload, stripping a data: URI prefix if present."""
    payload = photo_base64
    if payload.strip().startswith("data:") and "," in payload:
        payload = payload.split(",", 1)[1]

    try:
        return base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise InvalidImageFormatException() from exc


def validate_image(image_bytes: bytes) -> Image.Image:
    """Validates size, format, and resolution. Returns the opened image on success."""
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise ImageTooLargeException()

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImageFormatException() from exc

    if image.format not in ALLOWED_FORMATS:
        raise InvalidImageFormatException()

    if image.width < MIN_IMAGE_DIMENSION_PX or image.height < MIN_IMAGE_DIMENSION_PX:
        raise InvalidImageFormatException()

    return image


def save_image(image_bytes: bytes, image_format: str) -> str:
    """Saves the raw bytes under backend/uploads/ and returns the relative path."""
    extension = ALLOWED_FORMATS[image_format]
    filename = f"{uuid.uuid4()}.{extension}"
    (UPLOAD_DIR / filename).write_bytes(image_bytes)
    return f"uploads/{filename}"
