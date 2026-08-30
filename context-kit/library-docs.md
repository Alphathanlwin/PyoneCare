# Library Docs — Oral Health Advisory System (OHAS)
## FastAPI
### App Setup
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, assessment
app = FastAPI(title="OHAS API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(assessment.router, prefix="/api/v1/assessments", tags=["Assessments"])
```
### Dependency: DB Session
```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```
### Dependency: Current User
```python
# dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.utils.security import decode_token
from app.models.user import User
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, payload["sub"])
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```
---
## SQLAlchemy 2.x (Async)
### Querying
```python
from sqlalchemy import select
# Get one
result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
assessment = result.scalar_one_or_none()
# Get many
result = await db.execute(
    select(Assessment)
    .where(Assessment.user_id == user_id)
    .order_by(Assessment.created_at.desc())
    .offset((page - 1) * size)
    .limit(size)
)
assessments = result.scalars().all()
```
### Insert
```python
assessment = Assessment(user_id=user_id, risk_level=RiskLevel.HIGH)
db.add(assessment)
await db.commit()
await db.refresh(assessment)
```
### Eager Loading (avoid N+1)
```python
from sqlalchemy.orm import selectinload
result = await db.execute(
    select(Assessment)
    .options(
        selectinload(Assessment.diagnoses).selectinload(Diagnosis.recommendations)
    )
    .where(Assessment.id == assessment_id)
)
```
---
## Alembic (Migrations)
### Setup
```bash
alembic init alembic
# Edit alembic.ini: sqlalchemy.url = postgresql://...
# Edit env.py: target_metadata = Base.metadata
```
### Create Migration
```bash
alembic revision --autogenerate -m "create users table"
alembic upgrade head
```
---
## pyswip (SWI-Prolog Bridge)
### Installation
```bash
pip install pyswip
# SWI-Prolog must be installed on the system:
# Windows: https://www.swi-prolog.org/download/stable
```
### Usage Pattern
```python
from pyswip import Prolog
def run_diagnosis(active_symptoms: list[str]) -> dict:
    prolog = Prolog()
    prolog.consult("backend/prolog/knowledge_base.pl")
    # Assert dynamic facts
    for symptom in active_symptoms:
        prolog.assertz(f"symptom({symptom})")
    # Query for possible conditions and risk levels
    results = []
    for solution in prolog.query("possible(Condition), risk_level(Condition, Risk)"):
        condition = solution["Condition"]
        risk = solution["Risk"]
        # Get triggered rules
        rules = list(prolog.query(f"triggered_rules({condition}, Rules)"))
        results.append({"condition": condition, "risk": risk, "rules": rules})
    return results
```
### Subprocess Fallback
If pyswip has issues on Windows, use subprocess:
```python
import subprocess, tempfile, os
def run_prolog_query(symptom_facts: list[str], query: str) -> str:
    facts = "\n".join([f"symptom({s})." for s in symptom_facts])
    with tempfile.NamedTemporaryFile(suffix=".pl", mode="w", delete=False) as f:
        f.write(f":- consult('backend/prolog/knowledge_base.pl').\n")
        f.write(facts + "\n")
        f.write(f":- forall({query}, (write(result), nl)), halt.\n")
        tmp_path = f.name
    result = subprocess.run(["swipl", "-g", "true", "-t", "halt", tmp_path],
                            capture_output=True, text=True, timeout=10)
    os.unlink(tmp_path)
    return result.stdout
```
---
## python-jose + passlib (JWT & Auth)
### Password Hashing
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str) -> str:
    return pwd_context.hash(password)
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```
### JWT Token
```python
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
SECRET_KEY = "your-secret"
ALGORITHM = "HS256"
def create_access_token(user_id: str, expires_minutes: int = 60) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
```
---
## HuggingFace Inference API (CV Module)
### Usage Pattern
```python
import httpx
import base64
from app.config import settings
async def analyze_mouth_image(image_bytes: bytes) -> dict:
    """
    Calls HuggingFace zero-shot image classification.
    Returns detected visual issues as a list of labels.
    """
    b64 = base64.b64encode(image_bytes).decode()
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}"}
    payload = {
        "inputs": b64,
        "parameters": {
            "candidate_labels": [
                "healthy teeth", "tooth discoloration", "visible dark spot",
                "swollen gums", "mouth sore", "white lesion", "broken tooth"
            ]
        }
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(settings.HUGGINGFACE_MODEL_URL,
                                     headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
```
### Mapping CV Output to Symptoms
```python
CV_LABEL_TO_SYMPTOM = {
    "tooth discoloration": "yellow_staining",
    "visible dark spot":   "black_spot",
    "swollen gums":        "swollen_gums",
    "mouth sore":          "mouth_ulcer",
    "white lesion":        "white_spot",
    "broken tooth":        "broken_tooth",
}
def extract_symptoms_from_cv(cv_response: list[dict], threshold: float = 0.6) -> list[str]:
    detected = []
    for item in cv_response:
        if item["score"] >= threshold and item["label"] in CV_LABEL_TO_SYMPTOM:
            detected.append(CV_LABEL_TO_SYMPTOM[item["label"]])
    return detected
```
## Dr. Ava's Voice
There is no backend TTS call. `frontend/src/utils/speech.js` speaks directly
via the browser's built-in `SpeechSynthesis` API — no network request, no API
key, no cost. A duration-based safety timeout guarantees `onEnd` fires even
if the browser's speech engine silently drops its events (a known Chrome
quirk, most reliably triggered by calling `cancel()` immediately before a new
`speak()` — exactly what happens on every question transition in the guided
symptom quiz).
---
## Pillow (Image Validation)
```python
from PIL import Image
import io
def validate_image(image_bytes: bytes) -> None:
    """Raises ValueError if image fails validation."""
    if len(image_bytes) > 5 * 1024 * 1024:
        raise ValueError("IMAGE_TOO_LARGE")
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.format not in ("JPEG", "PNG", "WEBP"):
            raise ValueError("INVALID_IMAGE_FORMAT")
        if img.width < 100 or img.height < 100:
            raise ValueError("IMAGE_TOO_SMALL")
    except Exception:
        raise ValueError("INVALID_IMAGE_FORMAT")
```
---
## React Router v6
```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/assessment/new" element={<ProtectedRoute><NewAssessmentPage /></ProtectedRoute>} />
        <Route path="/assessment/:id" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```
---
## pydantic-settings (Config)
```python
# config.py
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    HUGGINGFACE_API_TOKEN: str
    HUGGINGFACE_MODEL_URL: str
    class Config:
        env_file = ".env"
settings = Settings()
```