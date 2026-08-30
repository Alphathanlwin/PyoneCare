import uuid

import httpx
import pytest

from database import engine
from main import app
from models.base import Base
from utils.security import create_access_token

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


def _unique_email(prefix: str = "jwt") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}@example.com"


async def _register(client: httpx.AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "JWT Tester", "date_of_birth": "1990-05-15"},
    )
    return response.json()["data"]["id"]


async def test_protected_route_rejects_missing_token():
    async with await _client() as client:
        response = await client.get("/api/v1/assessments/")
        assert response.status_code == 401


async def test_protected_route_rejects_malformed_token():
    async with await _client() as client:
        response = await client.get(
            "/api/v1/assessments/", headers={"Authorization": "Bearer not-a-real-jwt"}
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "UNAUTHORIZED"


async def test_protected_route_rejects_expired_token():
    async with await _client() as client:
        user_id = await _register(client, _unique_email("expired"))
        # -1 minutes puts `exp` in the past immediately, no need to sleep or
        # mock the clock.
        expired_token = create_access_token(user_id, expires_minutes=-1)

        response = await client.get(
            "/api/v1/assessments/", headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "UNAUTHORIZED"


async def test_protected_route_accepts_valid_unexpired_token():
    async with await _client() as client:
        user_id = await _register(client, _unique_email("valid"))
        token = create_access_token(user_id, expires_minutes=60)

        response = await client.get(
            "/api/v1/assessments/", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, response.text


async def test_protected_route_rejects_token_for_deleted_user():
    async with await _client() as client:
        # A syntactically valid, unexpired token whose subject simply
        # doesn't exist in the DB (e.g. account deleted after issuance).
        token = create_access_token(str(uuid.uuid4()), expires_minutes=60)

        response = await client.get(
            "/api/v1/assessments/", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 401
