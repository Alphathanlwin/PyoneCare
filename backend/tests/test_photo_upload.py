import base64
import io
import uuid

import httpx
import pytest
from PIL import Image

from database import engine
from main import app
from models.base import Base

PASSWORD = "SecurePassword123"


@pytest.fixture(autouse=True)
async def _dispose_engine():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


async def _client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


def _unique_email(prefix: str = "photo") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_login(client: httpx.AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Photo Tester", "date_of_birth": "1990-05-15"},
    )
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    return login.json()["data"]["access_token"]


def _all_false_symptoms() -> dict:
    return {
        "cold_sensitivity": False,
        "hot_sensitivity": False,
        "pressure_pain": False,
        "spontaneous_pain": False,
        "bleeding_gums": False,
        "swollen_gums": False,
        "receding_gums": False,
        "black_spot": False,
        "white_spot": False,
        "yellow_staining": False,
        "bad_breath": False,
        "dry_mouth": False,
        "mouth_ulcer": False,
        "burning_sensation": False,
        "loose_tooth": False,
        "broken_tooth": False,
        "brushes_twice_daily": False,
        "uses_floss": False,
        "sugary_diet": False,
        "acid_exposure": False,
    }


def _b64_image(size=(200, 200), fmt="JPEG", color=(180, 140, 120)) -> str:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()


async def _submit_with_photo(client: httpx.AsyncClient, headers: dict, front_b64: str | None) -> httpx.Response:
    return await client.post(
        "/api/v1/assessments/",
        json={
            "symptoms": _all_false_symptoms(),
            "photos": {"front": front_b64, "upper": None, "lower": None},
        },
        headers=headers,
    )


async def test_valid_jpeg_photo_accepted():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('valid_jpeg'))}"}
        response = await _submit_with_photo(client, headers, _b64_image(fmt="JPEG"))
        assert response.status_code == 201, response.text


async def test_valid_png_photo_accepted():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('valid_png'))}"}
        response = await _submit_with_photo(client, headers, _b64_image(fmt="PNG"))
        assert response.status_code == 201, response.text


async def test_valid_webp_photo_accepted():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('valid_webp'))}"}
        response = await _submit_with_photo(client, headers, _b64_image(fmt="WEBP"))
        assert response.status_code == 201, response.text


async def test_unsupported_format_rejected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('bad_format'))}"}
        # GIF is a real, decodable image format PIL happily opens — but it's
        # not in ALLOWED_FORMATS, so this exercises the format allow-list
        # check specifically, not just "can't parse this at all".
        response = await _submit_with_photo(client, headers, _b64_image(fmt="GIF"))
        assert response.status_code == 400, response.text
        assert response.json()["error"]["code"] == "INVALID_IMAGE_FORMAT"


async def test_undersized_resolution_rejected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('too_small'))}"}
        response = await _submit_with_photo(client, headers, _b64_image(size=(50, 50), fmt="JPEG"))
        assert response.status_code == 400, response.text
        assert response.json()["error"]["code"] == "INVALID_IMAGE_FORMAT"


async def test_oversized_photo_rejected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('too_big'))}"}
        # validate_image() checks byte size before ever parsing the image, so
        # arbitrary oversized bytes (not a real image) are enough to exercise
        # this path without generating a genuinely huge photo.
        oversized_b64 = base64.b64encode(b"0" * (6 * 1024 * 1024)).decode()
        response = await _submit_with_photo(client, headers, oversized_b64)
        assert response.status_code == 400, response.text
        assert response.json()["error"]["code"] == "IMAGE_TOO_LARGE"


async def test_malformed_base64_rejected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('malformed'))}"}
        response = await _submit_with_photo(client, headers, "not-valid-base64!!!")
        assert response.status_code == 400, response.text
        assert response.json()["error"]["code"] == "INVALID_IMAGE_FORMAT"


async def test_data_uri_prefixed_photo_accepted():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('data_uri'))}"}
        response = await _submit_with_photo(client, headers, f"data:image/jpeg;base64,{_b64_image()}")
        assert response.status_code == 201, response.text


async def test_assessment_without_photo_still_succeeds():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('no_photo'))}"}
        response = await _submit_with_photo(client, headers, None)
        assert response.status_code == 201, response.text
        assert response.json()["data"]["diagnoses"] == []
