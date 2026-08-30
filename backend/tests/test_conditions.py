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


def _unique_email(prefix: str = "cond") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_login(client: httpx.AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Condition Tester", "date_of_birth": "1990-05-15"},
    )
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    return login.json()["data"]["access_token"]


def _symptoms(**overrides: bool) -> dict:
    base = {
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
    base.update(overrides)
    return base


async def _submit(client: httpx.AsyncClient, headers: dict, symptoms: dict) -> dict:
    response = await client.post(
        "/api/v1/assessments/",
        json={"symptoms": symptoms, "photos": {"front": None, "upper": None, "lower": None}},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


def _condition_names(assessment: dict) -> set[str]:
    return {d["condition"] for d in assessment["diagnoses"]}


# Each combo below is chosen from knowledge_base.pl's possible/1 clauses to
# isolate the target condition (verify against the KB, not guessed) — see
# the clause-by-clause reasoning in the progress-tracker decision log.


async def test_dental_cavity_detected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('cavity'))}"}
        symptoms = _symptoms(black_spot=True, cold_sensitivity=True)
        assessment = await _submit(client, headers, symptoms)
        assert "DENTAL_CAVITY" in _condition_names(assessment)
        assert assessment["risk_level"] in ("MEDIUM", "HIGH")


async def test_gingivitis_detected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('gingivitis'))}"}
        symptoms = _symptoms(bleeding_gums=True, swollen_gums=True)
        assessment = await _submit(client, headers, symptoms)
        assert "GINGIVITIS" in _condition_names(assessment)


async def test_tooth_abscess_detected_as_high_risk():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('abscess'))}"}
        symptoms = _symptoms(spontaneous_pain=True, swollen_gums=True, bad_breath=True)
        assessment = await _submit(client, headers, symptoms)
        assert "TOOTH_ABSCESS" in _condition_names(assessment)
        assert assessment["risk_level"] == "HIGH"
        diagnosis = next(d for d in assessment["diagnoses"] if d["condition"] == "TOOTH_ABSCESS")
        assert any(r["urgency"] == "IMMEDIATE" for r in diagnosis["recommendations"])


async def test_enamel_erosion_detected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('erosion'))}"}
        symptoms = _symptoms(cold_sensitivity=True, hot_sensitivity=True, acid_exposure=True)
        assessment = await _submit(client, headers, symptoms)
        assert "ENAMEL_EROSION" in _condition_names(assessment)


async def test_canker_sores_detected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('canker'))}"}
        symptoms = _symptoms(mouth_ulcer=True, burning_sensation=True)
        assessment = await _submit(client, headers, symptoms)
        assert "CANKER_SORES" in _condition_names(assessment)
        assert assessment["risk_level"] == "LOW"


async def test_tooth_sensitivity_detected():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('sensitivity'))}"}
        symptoms = _symptoms(cold_sensitivity=True)
        assessment = await _submit(client, headers, symptoms)
        assert "TOOTH_SENSITIVITY" in _condition_names(assessment)
        assert assessment["risk_level"] == "LOW"


async def test_no_symptoms_yields_no_diagnoses_and_low_risk():
    async with await _client() as client:
        headers = {"Authorization": f"Bearer {await _register_and_login(client, _unique_email('healthy'))}"}
        assessment = await _submit(client, headers, _symptoms())
        assert assessment["diagnoses"] == []
        assert assessment["risk_level"] == "LOW"
