# PyoneCare(Ai-powered Oral Health Advisory and Triage tool)

A full-stack oral health triage application that combines computer vision, a Prolog-based expert system, and LLM-grounded chat to help patients assess dental conditions and locate nearby clinics.

## Overview

**Problem:** Most people cannot self-assess dental symptoms reliably. Delayed or incorrect self-diagnosis leads to worsening conditions and emergency visits that could have been prevented.

**Solution:** OHAS accepts intraoral photos and a symptom questionnaire, runs image classification via CLIP, evaluates risk through a Prolog knowledge base, and presents structured diagnoses with urgency-rated recommendations. A voice-guided screening flow and LLM chat provide a conversational intake experience.

**Why:** Built as an academic/capstone project demonstrating integration of symbolic AI (Prolog), computer vision (CLIP), and generative AI (LLM) in a clinical triage context.

## Key Features

- **Dual assessment modes** — static symptom questionnaire and live voice-guided screening with camera capture
- **3-angle photo capture** — front, upper, lower intraoral views with SVG overlay guides and device camera fallback
- **Computer vision analysis** — CLIP zero-shot classification across 7 oral health categories
- **Symbolic reasoning engine** — SWI-Prolog knowledge base diagnosing 6 conditions with risk levels and recommendations
- **LLM-grounded chat** — symptom extraction from free text and assessment explanation, constrained to retrieved data
- **Structured results page** — risk badges, condition cards, urgency levels, and disclaimer
- **Nearby clinic search** — Google Places integration with geolocation and area search fallback
- **Voice synthesis** — "Dr. Ava" avatar with browser SpeechSynthesis and talking-mouth animation
- **JWT authentication** — registration, login, ownership-scoped assessments, cross-user access guards
- **Pagination and history** — paginated assessment history with cursor support
- **Deployment-ready** — Dockerized backend, Render Blueprint, Supabase PostgreSQL

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 8, React Router v7, Axios, CSS (custom properties) |
| **Backend** | Python 3.11, FastAPI (async), SQLAlchemy 2.x (async), Alembic, Pydantic v2 |
| **Database** | PostgreSQL 15+ (Supabase), asyncpg connection pool |
| **Symbolic AI** | SWI-Prolog (subprocess bridge, 219-line knowledge base) |
| **Computer Vision** | HuggingFace Inference API — CLIP `clip-vit-base-patch32` (zero-shot classification) |
| **LLM** | Groq / OpenAI-compatible chat completions API |
| **Maps** | Google Places API (New) — nearby search + text search |
| **Auth** | python-jose (HS256 JWT), passlib (bcrypt) |
| **Infrastructure** | Docker, Render (Blueprint), persistent disk for uploads |
| **Testing** | pytest, pytest-asyncio, httpx AsyncClient |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                            │
│  Login → Dashboard → NewAssessment / LiveScreening → Result         │
│           ↕ ChatPanel (LLM explain)     ↕ NearbyClinics (Places)   │
│           ↕ GuidedCapture (camera)      ↕ SymptomVoiceStep         │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS / CORS
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       API Layer (FastAPI)                            │
│  POST /register  POST /login  POST /assessments                     │
│  POST /chat/intake  POST /chat/explain  GET /clinics/nearby         │
└──────────┬───────────┬──────────────┬───────────────────────────────┘
           │           │              │
           ▼           ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│  AuthService │ │Assessment │ │  Clinic      │
│  (JWT/bcrypt)│ │Service    │ │  Service     │
└──────────────┘ └─────┬─────┘ └──────────────┘
                       │
          ┌────────────┼────────────┬──────────────┐
          ▼            ▼            ▼              ▼
   ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
   │ CVService  │ │Prolog   │ │LLMService│ │ PostgreSQL │
   │ (CLIP)     │ │Service  │ │ (Groq)   │ │ (Supabase) │
   └────────────┘ └─────────┘ └──────────┘ └────────────┘
```

### Data Flow — Assessment

1. Patient uploads 3 intraoral photos (front, upper, lower) and answers symptom questions
2. `AssessmentService` decodes base64 images, validates format/size, saves to disk
3. `CVService` sends each image to CLIP zero-shot classification → 7 candidate labels → maps to symptom keys at ≥0.6 confidence
4. Active symptoms (questionnaire + CV-detected) are merged and asserted as Prolog facts
5. `PrologService` invokes `swipl` subprocess, runs `report/0`, parses pipe-delimited output
6. Diagnoses, recommendations, and overall risk are saved to PostgreSQL
7. Structured result is returned to the frontend

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI app, CORS, exception handlers
│   ├── config.py               # pydantic-settings env config
│   ├── database.py             # SQLAlchemy async engine
│   ├── models/                 # ORM models: User, Assessment, Diagnosis, Recommendation, SymptomResponse
│   ├── schemas/                # Pydantic request/response schemas
│   ├── routers/                # Route handlers: auth, assessment, chat, clinic
│   ├── services/               # Business logic: auth, assessment, prolog, cv, llm, clinic
│   ├── prolog/
│   │   └── knowledge_base.pl   # SWI-Prolog expert system (219 lines, 6 conditions)
│   ├── utils/                  # Security (JWT/bcrypt), image validation, response helpers
│   ├── alembic/                # 5 migration versions
│   ├── tests/                  # 8 test files (auth, assessments, chat, clinics, conditions, JWT, pagination, photos)
│   ├── Dockerfile              # Python 3.11-slim + SWI-Prolog
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client modules (auth, assessment, chat, clinic)
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/              # 7 pages: Login, Register, Dashboard, History, NewAssessment, LiveScreening, Result
│   │   ├── components/         # 17 components: AiGuide, GuidedCapture, ChatPanel, NearbyClinics, etc.
│   │   ├── data/               # Static symptom questions, clinical labels, capture angles
│   │   ├── hooks/              # useTalkingMouth
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Speech synthesis, result summary
│   ├── vite.config.ts          # HTTPS dev proxy, self-signed cert generation
│   └── package.json
├── context-kit/                # Architecture, API, schema, and build documentation
├── render.yaml                 # Render Blueprint (Docker backend + static frontend)
└── openapi.json                # OpenAPI 3.1.0 spec
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or a Supabase project)
- SWI-Prolog installed and on PATH
- API keys: HuggingFace (for CLIP), Groq or OpenAI-compatible LLM, Google Places

### Installation

```bash
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Environment Variables

Create `backend/.env` from the template below. Never commit real secrets.

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:6543/postgres?ssl=require
SECRET_KEY=<random-64-char-hex>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
HUGGINGFACE_API_TOKEN=hf_<your-token>
HUGGINGFACE_MODEL_URL=https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32
LLM_API_KEY=gsk_<your-groq-key>
LLM_MODEL=openai/gpt-oss-20b
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
GOOGLE_PLACES_API_KEY=AIza<your-key>
LOG_LEVEL=INFO
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Run Locally

```bash
# Terminal 1 — Backend
cd backend
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend: `http://localhost:5173` (proxies `/api` to port 8000)

For phone/LAN testing with camera and geolocation:

```powershell
$env:HTTPS=1; npm run dev
# Then open https://<your-lan-ip>:5173
```

## API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Create account (email, password, name) | No |
| `POST` | `/api/v1/auth/login` | Authenticate, returns JWT | No |
| `POST` | `/api/v1/assessments` | Submit photos + symptoms, run full pipeline | Yes |
| `GET` | `/api/v1/assessments` | List assessments (paginated) | Yes |
| `GET` | `/api/v1/assessments/{id}` | Fetch single assessment | Yes |
| `POST` | `/api/v1/chat/intake` | Free text → extracted symptoms | Yes |
| `POST` | `/api/v1/chat/explain` | Ask about an assessment result | Yes |
| `GET` | `/api/v1/clinics/nearby` | Search nearby dental clinics | No |
| `GET` | `/api/v1/health` | Health check | No |

All protected endpoints return `401` without a valid `Authorization: Bearer <token>` header. Assessment endpoints enforce ownership — cross-user access returns `403`.

## Engineering Highlights

**1. Prolog subprocess bridge for request isolation**

Rather than using pyswip (which shares a single Prolog engine across threads), `prolog_service.py` builds a temporary `.pl` script per request, invokes `swipl` as a subprocess, and parses pipe-delimited stdout. This gives full isolation between concurrent async requests without process pools or locks.

**2. Multi-signal symptom fusion**

The assessment pipeline merges symptoms from two independent sources — the patient's self-reported questionnaire and CLIP's zero-shot image classification — before passing the combined set to the Prolog engine. This means the expert system reasons over both behavioral and visual evidence.

**3. Graceful degradation across all external services**

Every external dependency (CLIP, LLM, Google Places, SpeechSynthesis) is wrapped in a try/except that returns a typed `503` error with a specific error code (`CV_SERVICE_UNAVAILABLE`, `LLM_SERVICE_UNAVAILABLE`, etc.). The core assessment flow continues without CV data if the image model is down; the frontend shows service status without crashing.

**4. Assessment-grounded LLM chat**

The `/chat/explain` endpoint injects only the current assessment's diagnoses, recommendations, and risk level into the LLM system prompt. The model cannot hallucinate beyond what the Prolog engine actually determined, and cross-user access is blocked at the route level before the LLM is ever called.

**5. Camera capture with permission timeout**

`GuidedCapture` implements a 6-second escape hatch: if `getUserMedia` permission hangs (common on mobile browsers), the component automatically falls back to a standard file upload. SVG overlays guide the user to the correct intraoral angle. The component works across secure and non-secure contexts with appropriate fallbacks.

**6. Alembic migrations with enum evolution**

The schema evolved across 5 migrations — adding tables, expanding enums, adding/removing a Telegram integration column — with no destructive migrations. All changes are forward-only and tested against Supabase's transaction pooler.

## Challenges & Technical Decisions

**Problem: Prolog engine shared state across requests**
Decision: Subprocess-per-request with temp `.pl` files instead of pyswip's shared engine.
Why: FastAPI runs async. A shared Prolog state would require locks or a process pool, adding complexity. Subprocess isolation is simpler, debuggable, and naturally concurrent.

**Problem: CLIP may be unavailable or slow**
Decision: CV analysis is optional — the assessment succeeds with questionnaire-only data if CLIP fails.
Why: Users shouldn't be blocked from triage because an ML model endpoint is down. The Prolog engine works with any symptom subset.

**Problem: LLM could hallucinate beyond assessment data**
Decision: Assessment-grounded prompting — the LLM system prompt contains only the assessment's own diagnosis data.
Why: Clinical accuracy matters. The LLM explains and answers questions about what was already determined, not what it guesses.

**Problem: Camera access requires HTTPS on non-localhost origins**
Decision: Dev HTTPS via `selfsigned` cert generation in Vite config, with automatic LAN IP detection.
Why: Camera and geolocation require secure contexts in modern browsers. A self-signed cert is sufficient for development and LAN testing.

## Future Improvements

- **Speech-to-text intake** — replace the step-by-step voice questionnaire with continuous audio transcription for a more natural screening experience
- **Prolog rule expansion** — add periodontal disease, oral cancer screening, and age-specific risk modifiers to the knowledge base
- **Assessment comparison** — track condition progression across multiple assessments over time with trend visualization
- **CI/CD pipeline** — GitHub Actions for linting, type checking, and automated test runs on push
- **Exportable reports** — PDF generation of assessment results for sharing with dentists

## License

[TODO: Add license]
