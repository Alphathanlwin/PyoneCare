import uuid

import httpx
import pytest

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


def _unique_email(prefix: str = "history") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_login(client: httpx.AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "History Tester", "date_of_birth": "1990-05-15"},
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


async def test_history_paginates_across_multiple_pages():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("paginated"))
        headers = {"Authorization": f"Bearer {token}"}

        created_ids = []
        for _ in range(12):
            response = await client.post(
                "/api/v1/assessments/",
                json={"symptoms": _all_false_symptoms(), "photos": {"front": None, "upper": None, "lower": None}},
                headers=headers,
            )
            assert response.status_code == 201, response.text
            created_ids.append(response.json()["data"]["id"])

        page1 = await client.get("/api/v1/assessments/?page=1&size=10", headers=headers)
        assert page1.status_code == 200, page1.text
        body1 = page1.json()["data"]
        assert body1["total"] == 12
        assert body1["page"] == 1
        assert body1["size"] == 10
        assert body1["pages"] == 2
        assert len(body1["items"]) == 10

        page2 = await client.get("/api/v1/assessments/?page=2&size=10", headers=headers)
        assert page2.status_code == 200, page2.text
        body2 = page2.json()["data"]
        assert body2["page"] == 2
        assert len(body2["items"]) == 2

        # No overlap between the two pages, and every created assessment is
        # accounted for exactly once across both pages.
        page1_ids = {item["id"] for item in body1["items"]}
        page2_ids = {item["id"] for item in body2["items"]}
        assert page1_ids.isdisjoint(page2_ids)
        assert page1_ids | page2_ids == set(created_ids)

        # Newest-first ordering: the last-created assessment is first on page 1.
        assert body1["items"][0]["id"] == created_ids[-1]


async def test_history_respects_max_page_size():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("maxsize"))
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/v1/assessments/?page=1&size=100", headers=headers)
        assert response.status_code == 422, response.text
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_history_empty_for_new_user():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("empty"))
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/v1/assessments/?page=1&size=10", headers=headers)
        assert response.status_code == 200, response.text
        body = response.json()["data"]
        assert body["total"] == 0
        assert body["items"] == []
        assert body["pages"] == 1
