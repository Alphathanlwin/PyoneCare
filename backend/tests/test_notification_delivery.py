import asyncio
import uuid
from unittest.mock import patch

import httpx
import pytest

from config import settings
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


def _unique_email(prefix: str = "notify") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_login(client: httpx.AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Notify Tester", "date_of_birth": "1990-05-15"},
    )
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    return login.json()["data"]["access_token"]


def _all_false_symptoms(**overrides: bool) -> dict:
    symptoms = {
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
    symptoms.update(overrides)
    return symptoms


async def _link_telegram(client: httpx.AsyncClient, headers: dict) -> None:
    """Drives the real link flow (GET /telegram/link -> POST /telegram/webhook
    with /start <token>) so the resulting telegram_chat_id is set exactly the
    way production traffic sets it, not poked directly into the DB."""
    with patch.object(settings, "TELEGRAM_BOT_USERNAME", "ohas_test_bot"):
        link_response = await client.get("/api/v1/telegram/link", headers=headers)
    token = link_response.json()["data"]["deep_link"].split("?start=")[1]

    webhook_response = await client.post(
        "/api/v1/telegram/webhook",
        json={"update_id": 1, "message": {"chat": {"id": 555444333}, "text": f"/start {token}"}},
    )
    assert webhook_response.status_code == 200, webhook_response.text


async def test_assessment_creation_notifies_linked_telegram_user():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("linked"))
        headers = {"Authorization": f"Bearer {token}"}
        await _link_telegram(client, headers)

        with patch(
            "services.notification_service.NotificationService.send_assessment_report"
        ) as mock_send:
            response = await client.post(
                "/api/v1/assessments/",
                json={
                    "symptoms": _all_false_symptoms(bleeding_gums=True, swollen_gums=True),
                    "photos": {"front": None, "upper": None, "lower": None},
                },
                headers=headers,
            )
            assert response.status_code == 201, response.text

            # The call is fired via asyncio.create_task (non-blocking by
            # design — see assessment_service.py), so it may not have run
            # yet at this exact point; give the event loop a couple of
            # turns to schedule it.
            for _ in range(5):
                await asyncio.sleep(0)

        assert mock_send.called, "expected send_assessment_report to be scheduled for a linked user"
        call_chat_id = mock_send.call_args.args[0]
        assert call_chat_id == "555444333"


async def test_assessment_creation_skips_notification_for_unlinked_user():
    async with await _client() as client:
        token = await _register_and_login(client, _unique_email("unlinked"))
        headers = {"Authorization": f"Bearer {token}"}
        # No _link_telegram() call — telegram_chat_id stays NULL.

        with patch(
            "services.notification_service.NotificationService.send_assessment_report"
        ) as mock_send:
            response = await client.post(
                "/api/v1/assessments/",
                json={"symptoms": _all_false_symptoms(), "photos": {"front": None, "upper": None, "lower": None}},
                headers=headers,
            )
            assert response.status_code == 201, response.text
            for _ in range(5):
                await asyncio.sleep(0)

        assert not mock_send.called


async def test_notification_send_never_raises_when_bot_token_unset():
    """send_message() (and therefore send_assessment_report()) must degrade
    to a no-op, not an exception, when TELEGRAM_BOT_TOKEN is unset — an
    un-awaited asyncio.create_task that raises would surface as an unhandled
    "exception was never retrieved" warning instead of failing the request,
    but a silent no-op is the actually-intended behavior here.
    """
    from services.notification_service import NotificationService

    with patch.object(settings, "TELEGRAM_BOT_TOKEN", ""):
        await NotificationService().send_message("123456", "test message")
    # No exception raised == pass.
