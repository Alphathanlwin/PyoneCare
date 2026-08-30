import uuid
from unittest.mock import patch

import httpx
import pytest

from config import settings
from database import engine
from main import app
from schemas.clinic import ClinicResponse

PASSWORD = "SecurePassword123"


@pytest.fixture(autouse=True)
async def _dispose_engine():
    yield
    await engine.dispose()


async def _client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


def _unique_email(prefix: str = "clinic") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_login(client: httpx.AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Clinic User",
            "date_of_birth": "1990-05-15",
        },
    )
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    return login.json()["data"]["access_token"]


async def test_nearby_clinics_unconfigured_returns_503():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("clinic1"))
        headers = {"Authorization": f"Bearer {token}"}

        with patch.object(settings, "GOOGLE_PLACES_API_KEY", ""):
            response = await client.get(
                "/api/v1/clinics/nearby?lat=16.8409&lng=96.1735&radius=5000",
                headers=headers,
            )

        assert response.status_code == 503, response.text
        assert response.json()["error"]["code"] == "CLINIC_SERVICE_UNAVAILABLE"


async def test_nearby_clinics_returns_results():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("clinic2"))
        headers = {"Authorization": f"Bearer {token}"}

        fake_clinics = [
            ClinicResponse(
                place_id="abc123",
                name="Smile Dental Clinic",
                address="123 Main St",
                rating=4.5,
                distance_km=1.2,
                phone="+95 9 123 4567",
            )
        ]
        with patch("services.clinic_service.ClinicService.nearby", return_value=fake_clinics):
            response = await client.get(
                "/api/v1/clinics/nearby?lat=16.8409&lng=96.1735&radius=5000",
                headers=headers,
            )

        assert response.status_code == 200, response.text
        items = response.json()["data"]["items"]
        assert len(items) == 1
        assert items[0]["name"] == "Smile Dental Clinic"
        assert items[0]["distance_km"] == 1.2


async def test_nearby_clinics_rejects_invalid_coordinates():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("clinic3"))
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            "/api/v1/clinics/nearby?lat=999&lng=96.1735&radius=5000",
            headers=headers,
        )
        assert response.status_code == 422
