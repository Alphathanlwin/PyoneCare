# Progress Tracker — Oral Health Advisory System (OHAS)
> Update this file at the end of every development session.
> Mark items as `[x]` when complete, `[/]` when in progress, `[ ]` when pending.
---
## Phase 1 — Project Setup & Auth
### Backend
- [x] FastAPI project structure initialized
- [x] `.env` + `config.py` set up
- [x] `database.py` with async SQLAlchemy
- [x] `User` ORM model created
- [x] Alembic initialized + initial migration run
- [x] `auth_service.py` implemented (register + login)
- [x] `security.py` implemented (bcrypt + JWT)
- [x] `auth.py` router: `POST /auth/register`
- [x] `auth.py` router: `POST /auth/login`
- [x] `get_current_user` dependency implemented
- [x] CORS middleware configured
- [x] Auth endpoints tested via Swagger UI
### Frontend
- [x] Vite + React project initialized
- [x] React Router v6 routes configured (using v7, not v6 as originally planned)
- [x] `AuthContext.jsx` implemented
- [x] `LoginPage.jsx` built and connected to API
- [x] `RegisterPage.jsx` built and connected to API
- [x] `ProtectedRoute.jsx` implemented
- [x] `Navbar.jsx` built
- [x] Global CSS design system applied (dark theme, colors, typography)
---
## Phase 2 — Symptom Questionnaire
### Backend
- [x] `Assessment` ORM model created
- [x] `SymptomResponse` ORM model created
- [x] Migration for assessments + symptom_responses tables run
- [x] `SymptomPayload` Pydantic schema created
- [x] `POST /assessments/` stub endpoint implemented (superseded by Phase 3 — wired to the full Prolog-backed service, not just a stub)
### Frontend
- [x] `NewAssessmentPage.jsx` with 4-step stepper built
- [x] `SymptomToggle.jsx` component built
- [x] Step 1 form (Pain & Sensitivity) built
- [x] Step 2 form (Gum & Appearance) built
- [x] Step 3 form (Mouth & Habits) built
- [x] Step 4 form (Hygiene & Photo) built
- [x] Step navigation (Back / Next) working
- [x] Submit button wired to `POST /api/v1/assessments/`
---
## Phase 3 — Prolog Diagnosis Engine
### Prolog
- [x] SWI-Prolog installed locally
- [x] `knowledge_base.pl` created with all 6 conditions
- [x] KB tested manually in SWI-Prolog REPL
### Backend
- [x] `prolog_service.py` implemented (via a **subprocess** bridge to the `swipl` CLI, not `pyswip` — its embedded engine isn't request-isolated for concurrent async requests; see decision log)
- [x] `Diagnosis` ORM model created
- [x] `Recommendation` ORM model created
- [x] Migration for diagnoses + recommendations tables run
- [x] `assessment_service.py` fully implemented (Prolog orchestration)
- [x] `AssessmentResponse` Pydantic schema created
- [x] `POST /assessments/` wired to full service
### Frontend
- [x] `ResultPage.jsx` built
- [x] `RiskBadge.jsx` component built
- [x] `DiagnosisCard.jsx` component built
- [x] `RecommendationCard.jsx` component built
- [x] Navigation to ResultPage after submission working
---
## Phase 3A — Live AI Screening: Foundation (Frontend-only)
> New parallel entry point alongside the static questionnaire — does not block or replace Phase 2/3.
### Frontend
- [x] `AiGuide.jsx` built (avatar, `state` prop, pose swapping, idle breathing animation, speech-bubble caption)
- [x] `utils/speech.js` built (`speak(text, { onStart, onEnd })` wrapper — now tries real ElevenLabs TTS first, falls back to `SpeechSynthesis`)
- [x] Mouth-swap talking animation (`useTalkingMouth` hook) wired to `onStart`/`onEnd`
- [x] `LiveScreeningPage.jsx` state machine built (`intro → ask_symptoms → capture → analyzing → reveal`) — now wired to the real API, not dummy transitions
- [x] Route `/assessment/live` added in `App.jsx`
- [x] "Live AI Screening" button added on `DashboardPage.jsx`
- [x] Screens match Pencil.dev designs for each state
---
## Phase 3B — Live AI Screening: Symptom Voice Step
### Frontend
- [x] `SymptomVoiceStep.jsx` built (one YES/NO question at a time, reuses symptom key list + `SymptomToggle` styling)
- [x] Answers wired into local state matching existing `symptoms{}` payload shape
- [x] Dr. Ava speaks each question via `speak()` before showing Yes/No buttons
- [x] Progress dots reflect question count
---
## Phase 3C — Live AI Screening: Guided Camera Capture
### Frontend
- [x] `GuidedCapture.jsx` built (`getUserMedia`, live `<video>` preview, `<canvas>` capture)
- [x] 3 SVG overlay guides built (front bite / upper arch / lower arch)
- [x] Sequential flow: capture → confirm/retake → next angle
- [x] Camera-denied fallback → Dr. Ava apologetic pose → falls back to `PhotoUpload.jsx`
- [x] 3 captured images stored as base64 in local state
---
## Phase 3D — Live AI Screening: Backend Multi-Photo + CV Integration
> Folds in the original Phase 4 CV work, pulled forward to support Live Screening.
### Backend
- [x] `AssessmentCreate` schema updated: `photo_base64` → `photos: {front, upper, lower}` (optional, nullable)
- [x] `uploads/` directory structure created
- [x] `image_utils.py` implemented (validation + save)
- [x] `cv_service.py` implemented (HuggingFace API call per image)
- [x] CV label → symptom key mapping implemented
- [x] CV results merged (union across 3 images) and integrated into `assessment_service.py`
- [x] Graceful fallback on `CV_SERVICE_UNAVAILABLE`
- [x] `prolog_service.py` + `knowledge_base.pl` confirmed in place (Phase 3)
---
## Phase 3E — Live AI Screening: Reveal + Result Integration
### Frontend
- [x] `reveal` state shows risk-level badge + spoken summary via Dr. Ava
- [x] Navigation to `ResultPage.jsx` with real assessment ID working
- [x] Dr. Ava "here's what I found" treatment added to `ResultPage.jsx` (reuses `AiGuide.jsx`)
- [x] `DiagnosisCard.jsx` / `RecommendationCard.jsx` confirmed working for Live-Screening-originated assessments
---
## Phase 4 — AI Chatbot (Intake + Explainer)
> Constrained, non-diagnostic LLM assistance. Prolog remains the sole diagnostic authority.
### Backend
- [x] `llm_service.py` implemented (thin LLM API wrapper, OpenAI-compatible chat completions)
- [x] `chat_intake_service.py` implemented (free-text → extracted `symptoms{}`, validated against allowed keys)
- [x] `routers/chat.py`: `POST /api/v1/chat/intake` implemented
- [x] `chat_explain_service.py` implemented (grounded strictly in assessment's own `triggered_rules`/`explanation`/`recommendation`)
- [x] `POST /api/v1/chat/explain` implemented
- [x] `schemas/chat.py` created (`ChatIntakeRequest/Response`, `ChatExplainRequest/Response`)
- [x] `LLM_API_KEY`, `LLM_MODEL` (+ `LLM_API_URL`) added to `.env`
- [x] Graceful fallback on `LLM_SERVICE_UNAVAILABLE`
### Frontend
- [x] Optional free-text symptom entry point wired to `/chat/intake` (`SymptomIntakeChat.jsx` on `NewAssessmentPage.jsx`)
- [x] Chat input component built on `ResultPage.jsx` (`ChatPanel.jsx`), wired to `/chat/explain`
- [x] Dr. Ava optionally speaks explainer answers via `speak()` (mute/unmute toggle, default on)
---
## Phase 5 — Delivery & Discovery
### Backend
- [x] `telegram_chat_id` column added to `users` (migration `dbc197f185d2`, applied to the live Supabase DB)
- [x] Bot-linking flow implemented (`/start` deep link — `GET /api/v1/telegram/link` + `POST /api/v1/telegram/webhook`)
- [x] `notification_service.py` implemented (Telegram Bot API `sendMessage`, fire-and-forget via `asyncio.create_task`, never raises)
- [x] `clinic_service.py` implemented (Google Places Nearby Search, `type=dentist`, + Place Details for phone, haversine distance)
- [x] `GET /api/v1/clinics/nearby?lat=&lng=&radius=` implemented
- [x] Graceful fallback on `CLINIC_SERVICE_UNAVAILABLE`
- [x] `GOOGLE_PLACES_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` added to `.env`
### Frontend
- [x] "Find nearby clinics" button + list UI built on `ResultPage.jsx` (`NearbyClinics.jsx`)
- [x] Telegram account linking UI built (`TelegramLinkCard.jsx` on `DashboardPage.jsx`)
> Note: Real calendar/slot booking (Google Calendar API) is parked — this phase is clinic discovery only.
---
## Phase 6 — History & Dashboard
### Backend
- [x] `GET /assessments/` with pagination implemented
- [x] `GET /assessments/{id}` with ownership check implemented
- [x] Eager loading for diagnoses + recommendations added
### Frontend
- [x] `HistoryPage.jsx` built with paginated list
- [x] `DashboardPage.jsx` built (stats + recent assessments)
- [x] History rows clickable → navigate to ResultPage
---
## Phase 7 — Polish & Final Review
### Backend
- [x] Global exception handler added
- [x] Input validation confirmed for all endpoints
- [x] All error codes match `api-standards.md`
- [x] `README.md` written
### Frontend
- [x] Loading spinners added to all async operations
- [x] Error toast notifications implemented
- [x] All form validations complete
- [x] Disclaimer text on ResultPage added
- [x] Final visual polish done (spacing, animations, responsiveness) across both entry points
### Testing & Documentation
- [ ] All 6 conditions tested manually (symptom combinations)
- [ ] Photo upload tested (valid + invalid cases) — static form AND Live Screening
- [ ] Live Screening camera fallback path tested
- [ ] Chatbot intake + explainer grounding tested (no off-topic answers)
- [ ] Telegram delivery + nearby clinic discovery tested
- [ ] History pagination tested
- [ ] JWT expiry + protected route tested
- [x] Final `progress-tracker.md` status updated
---
## Notes / Decisions Log
> Record important decisions made during development here.
| Date | Decision | Reason |
|------|----------|--------|
| 2026-08-09 | Direct Supabase DB host (`db.*.supabase.co`) is IPv6-only and unreachable from this machine; switched to **transaction pooler** (`aws-0-ap-northeast-1.pooler.supabase.com:6543`) with `?ssl=require`. | Pooler resolves to IPv4 and allows SSL; direct host has only an AAAA record and no IPv6 route. |
| 2026-08-09 | Disabled asyncpg statement caching (`statement_cache_size=0`, `prepared_statement_cache_size=0`) in `database.py` and `alembic/env.py`. | Supabase transaction pooler does not support asyncpg prepared statements (`DuplicatePreparedStatementError`). |
| 2026-08-09 | Pinned `bcrypt==4.0.1` in `requirements.txt`. | `passlib 1.7.4` is incompatible with `bcrypt>=4.1` (removed `__about__`), crashing register with 500. |
---
## Notes / Decisions Log
> Record important decisions made during development here.
| Date | Decision | Reason |
|------|----------|--------|
| 2026-08-09 | Direct Supabase DB host (`db.*.supabase.co`) is IPv6-only and unreachable from this machine; switched to **transaction pooler** (`aws-0-ap-northeast-1.pooler.supabase.com:6543`) with `?ssl=require`. | Pooler resolves to IPv4 and allows SSL; direct host has only an AAAA record and no IPv6 route. |
| 2026-08-09 | Disabled asyncpg statement caching (`statement_cache_size=0`, `prepared_statement_cache_size=0`) in `database.py` and `alembic/env.py`. | Supabase transaction pooler does not support asyncpg prepared statements (`DuplicatePreparedStatementError`). |
| 2026-08-09 | Pinned `bcrypt==4.0.1` in `requirements.txt`. | `passlib 1.7.4` is incompatible with `bcrypt>=4.1` (removed `__about__`), crashing register with 500. |
| 2026-08-11 | `PhotoUpload.jsx` emits the full `data:` URI to the page; `NewAssessmentPage.jsx` strips the prefix and sends raw base64 as `photo_base64`. | Backend `decode_base64_image` also accepts the `data:` URI, but raw base64 keeps the payload minimal. |
| 2026-08-11 | Ran the previously-pending `c243bf08b89a_create_assessments_and_symptom_` migration against the live Supabase DB (`alembic upgrade head`). | The DB was unreachable in the session that wrote the migration; this session's `.env` reaches it fine, and applying it was required to test the CV/photo work end-to-end. User confirmed before running. |
| 2026-08-11 | `CVServiceUnavailableError` (plain `Exception`, not `HTTPException`) is caught inside `assessment_service.create()` and never surfaces to the client — `image_analysis_result` is set to `{"status": "CV_SERVICE_UNAVAILABLE"}` and the assessment still saves with symptom-only data. | Photo is optional; a CV outage must not fail assessment submission (Phase 4 requirement: "Handle CV_SERVICE_UNAVAILABLE gracefully"). Verified live: real HF call fails against the placeholder `.env` token and the fallback path saves correctly (HTTP 201). |
| 2026-08-15 | Discovered at the start of Phase 3D that Phase 3 (Prolog engine) was never actually built despite Phase 4 being checked off — `assessment_service.create()` returned a hardcoded `RiskLevel.LOW` stub, and `prolog_service.py`/`knowledge_base.pl` didn't exist. Built Phase 3 as a prerequisite (KB copied verbatim from `prolog-kb.md`, fully pre-specified — no new clinical logic invented) since the Phase 3D deliverable explicitly requires "a real diagnosis." | AGENTS.md rule 8 ("ask if uncertain") was weighed against the fact that every line of the KB was already fully specified in the docs — implementing it was mechanical, not a design decision, and skipping it would leave the stated deliverable unmet. |
| 2026-08-15 | `prolog_service.py` uses **subprocess** (`swipl` CLI), not `pyswip`, despite `pyswip` being architecture.md's preferred option. | `pyswip`'s embedded engine is a single global interpreter per process — not isolated per request, so concurrent async requests would race on asserted `symptom/1` facts. `library-docs.md` itself documents subprocess as the Windows fallback; this dev machine is Windows. |
| 2026-08-15 | `knowledge_base.pl` gained a `report/0` helper (dedupes matched conditions via `sort/2`, picks the highest-severity `risk_level/2`/`explanation/2` per condition via `once/1`) and explicit `set_prolog_flag(encoding, utf8)` / `set_stream(user_output, encoding(utf8))` directives. | Manual REPL testing surfaced two real bugs: (1) naive `possible(C), risk_level(C,R)` backtracking produced duplicate/contradictory risk rows per condition — confirmed via `swipl` before writing any Python; (2) SWI-Prolog on Windows defaults to the system codepage for both file reads and stdout writes, silently mangling the em dashes in `explanation/2` texts into mojibake — confirmed by inspecting raw output bytes, not just terminal display (which itself misrenders correct UTF-8). |
| 2026-08-15 | `assessments.photo_url VARCHAR(500)` replaced with `photo_urls JSONB` (`{"front", "upper", "lower"}`, each nullable); `image_analysis_result` keeps its JSONB type but now holds one CV result per angle instead of one overall. Migration drops the old column outright rather than migrating existing values. | Phase 3D's guided capture produces up to 3 photos, not 1. Dropping instead of migrating `photo_url` is acceptable pre-launch — no production assessment data exists yet that depends on it. |
| 2026-08-15 | `diagnoses.triggered_rules` is populated as `["possible(<condition>)", "risk_level(<condition>, <risk>)"]` — the two predicate calls that succeeded — rather than deeper per-clause provenance. | `report/0` reports the winning risk level via `once/1`, not which specific clause matched; `api-standards.md`'s own example (`"needs_dentist(dental_cavity)"`) isn't a real predicate in the KB either, confirming the field is meant as an illustrative rule-name list rather than exact clause introspection. Deeper instrumentation (naming every clause) was out of scope for Phase 3D. |
| 2026-08-15 | `NewAssessmentPage.jsx`'s single optional photo now maps to `photos.front` (with `upper`/`lower` sent as `null`) instead of the removed `photo_base64` field. | Required to avoid breaking the existing static-questionnaire photo upload when the schema field was renamed per Phase 3D's explicit instruction. |
| 2026-08-15 | Built `ResultPage.jsx`, `DiagnosisCard.jsx`, `RecommendationCard.jsx`, and `data/clinicalLabels.js` (shared `CONDITION_LABELS`/`URGENCY_LABELS` maps). `NewAssessmentPage.jsx` now passes the freshly-created `AssessmentResponse` via router `state` on navigation, so the primary post-submit flow renders immediately without a backend round-trip. | `ui-rules.md`'s Result Page spec requires triggered rules shown as plain English, not raw Prolog predicates — added `formatTriggeredRule()` in `DiagnosisCard.jsx` to translate `possible(condition)` / `risk_level(condition, level)` strings client-side rather than changing the backend's `triggered_rules` format. |
| 2026-08-15 | `ResultPage.jsx` falls back to `GET /assessments/{id}` (new `getAssessment()` in `api/assessment.js`) only when no router `state` is present (e.g. a direct link or refresh), and shows a friendly "could not be found" error instead of crashing if that call fails. | `GET /assessments/{id}` is still unbuilt (Phase 5 backend, not in scope here) — confirmed live via Playwright that the fallback degrades gracefully rather than exposing the missing-endpoint error. This also means `DashboardPage.jsx`'s existing links to `/assessment/:id/result` for past assessments won't resolve until Phase 5's `GET /assessments/{id}` (and `GET /assessments/`, also still a 405 today) are built. |
| 2026-08-15 | `LiveScreeningPage.jsx`'s analyzing step now fires `createAssessment()` in a `useEffect` gated on `symptoms && photos`, while the visual progress bar climbs independently and holds at 96% until that real request settles (success or failure) — only then does it jump to 100% and switch to `reveal` or a new `error` screen. | Keeps the "reading your scans" animation feeling alive during the real network/CV/Prolog round-trip without faking a "done" state before the actual diagnosis exists; a `cancelled` flag guards against React 19 StrictMode's double-invoked dev effects racing two requests. |
| 2026-08-15 | Removed `LiveScreeningPage.jsx`'s hardcoded "Smile score X/100" meter (`.live-meter` and related CSS) from the reveal screen instead of wiring it to real data. | `AssessmentResponse` has no numeric score field — the meter was fabricated UI with no backing data (AGENTS.md rule 1: never guess/invent fields). Replaced with a real "N condition(s) detected" line sourced from `assessment.diagnoses.length`. |
| 2026-08-15 | Added a shared `buildResultSummary()` in `utils/resultSummary.js`, used by both `LiveScreeningPage`'s reveal caption and `ResultPage`'s new Dr. Ava row, instead of writing the summary text separately in each place. | Phase 3E asks for "a short spoken summary via Dr. Ava" on reveal and a "here's what I found" treatment on `ResultPage` — sharing one function keeps the two surfaces from describing the same assessment differently. |
| 2026-08-15 | Verified live via Playwright (fake camera device + a `speechSynthesis.speak` stub to make voice-gated Yes/No buttons deterministic in headless Chromium) that answering all 20 symptom questions "Yes" plus capturing 3 photos produces a real 5-condition HIGH-risk diagnosis, a correctly red-colored `HIGH RISK` reveal badge, and identical diagnosis/recommendation data rendered on `ResultPage.jsx` after navigating with real router `state`. | Confirms Phase 3E's deliverable — Live Screening is a fully working alternate entry point into the same assessment → result pipeline as the static questionnaire, not a parallel/divergent one. |
| 2026-08-15 | Diagnosed why the camera flow skipped straight to the photo-upload fallback on a phone: `http://<lan-ip>:5173` is not a secure context (only `https://` and `localhost` are), so `navigator.mediaDevices` doesn't exist there and `GuidedCapture.jsx`'s `getUserMedia` call rejects instantly, before any permission prompt. Fixed by adding `@vitejs/plugin-basic-ssl` + `server.https: true` in `vite.config.js`, plus `server.proxy: { '/api': ... }` forwarding to the backend so the browser only ever talks to the https origin (avoiding both CORS and https-page-calling-http mixed-content blocks). `api/auth.js`'s `API_BASE_URL` simplified to the relative `/api/v1` accordingly. | Confirmed via Playwright with fake camera device flags against `https://<lan-ip>:5173` that `navigator.mediaDevices` is now defined, `window.isSecureContext` is `true`, and the real 3-angle `GuidedCapture` UI renders instead of the denied-fallback. |
| 2026-08-15 | Added real neural TTS for Dr. Ava (ElevenLabs) instead of tuning the existing browser `SpeechSynthesis` voice — user explicitly chose this over the free/limited quick-tweak option, understanding the per-character cost and that it requires their own API key. New `services/tts_service.py` (mirrors `cv_service.py`'s httpx + graceful-unavailable pattern) + `POST /api/v1/tts/` (`routers/tts.py`, requires auth — cost control) returning raw `audio/mpeg`. `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` are optional settings (default `""`); `TTSServiceUnavailableError` → `503 TTS_SERVICE_UNAVAILABLE` when unset or the API call fails. | `utils/speech.js`'s `speak()` now tries `POST /api/v1/tts/` first and falls back to the pre-existing `SpeechSynthesis` path on any failure (including no key configured yet) — every caller (`AiGuide.jsx` via all its call sites) keeps the same `onStart`/`onEnd` contract unchanged, so Dr. Ava never goes silent even before a real key is added to `backend/.env`. |
| 2026-08-17 | `llm_service.py` targets a generic **OpenAI-compatible** chat-completions endpoint (`LLM_API_URL`, default `https://api.openai.com/v1/chat/completions`) rather than binding to one vendor SDK. `LLM_API_KEY`/`LLM_MODEL`/`LLM_API_URL` are all optional settings (key defaults to `""`); an unset key or any network/parse failure raises `LLMServiceUnavailableError` → `503 LLM_SERVICE_UNAVAILABLE`, same graceful-degradation shape as `tts_service.py`/`cv_service.py`. | Build plan says "thin wrapper around chosen LLM API" without naming a vendor; most providers (OpenAI, Groq, OpenRouter, etc.) speak this same request/response shape, so swapping providers later is a config change, not a code change. |
| 2026-08-17 | `chat_intake_service.py` has the LLM return JSON with **only the symptom keys the text actually addresses** (explicit true/false), never a full 20-key object — unaddressed keys are omitted, not defaulted to `false`. Keys outside `SymptomPayload`'s field list are dropped into a separate `unrecognized` list rather than raised as an error. | A free-text description ("my tooth hurts when I drink something cold") should only touch the toggles it actually talks about; defaulting every other symptom to `false` would silently overwrite answers the user gave elsewhere in the form. Silently dropping (not erroring on) unrecognized keys keeps a slightly hallucinated LLM response from failing the whole request — `database-schema.md`'s allowed-key list remains the enforced boundary, per AGENTS.md rule 1. |
| 2026-08-17 | `chat_explain_service.py` reuses `AssessmentService.get_for_user()` (already used by `GET /assessments/{id}`) for ownership/404 handling instead of duplicating that query, then serializes the assessment's diagnoses/recommendations into a plain-text context block embedded in the system prompt, with an explicit instruction to answer only from that block and return one fixed refusal sentence otherwise. | Prolog must remain the sole diagnostic authority (Phase 4 goal) — the LLM never sees the raw symptom facts or knowledge base, only this assessment's already-decided `condition`/`explanation`/`triggered_rules`/`recommendations`, so it can explain but not re-diagnose. Reusing `get_for_user()` also means chat/explain inherits whatever ownership-check behavior `GET /assessments/{id}` has (see below) rather than diverging from it. |
| 2026-08-17 | Fixed a third pre-existing failure, `test_auth.py::test_unhandled_exception_returns_standard_error_response` — not an app bug. Starlette's `ServerErrorMiddleware` always re-raises the original exception after building the 500 response (so real servers can log it, per Starlette's own comment), and `httpx.ASGITransport` defaults to `raise_app_exceptions=True`, which propagated that re-raise into the test itself instead of returning the response `main.py`'s `@app.exception_handler(Exception)` had already built correctly. Fixed by adding `raise_app_exceptions=False` to the `ASGITransport` in all three test files' `_client()` helpers (`test_auth.py`, `test_assessments_history.py`, `test_chat.py`). | Confirmed via `git stash` this failure also pre-dates this session. `main.py`'s exception handler itself was never broken — only the test harness wasn't configured to see its output, so any future test that intentionally triggers a 500 would hit the same false failure without this fix. |
| 2026-08-17 | While building `test_chat.py`, found and then (on request) fixed two further pre-existing bugs unrelated to Phase 4 itself, both confirmed via `git stash` to exist identically on `main` beforehand: (1) `test_user_can_list_and_fetch_own_assessments`'s payload set only `bleeding_gums: true`, which doesn't satisfy any `possible/1` clause in `knowledge_base.pl` (gingivitis needs `bleeding_gums` **and** `swollen_gums`, or `bleeding_gums` **and** `bad_breath`) — fixed by adding `swollen_gums: true` to the test payload; the KB itself was correct. (2) `AssessmentService.get_for_user()` scoped its `WHERE` by `user_id`, so a mismatched owner returned `404 ASSESSMENT_NOT_FOUND` instead of the `403 FORBIDDEN` `test_other_user_cannot_access_someone_else_assessment` and `api-standards.md` both expect — fixed by querying on `id` alone and raising the new `exceptions.ForbiddenException` (403) when `assessment.user_id != user_id`, vs. the new `AssessmentNotFoundException` (404) when no row matches at all. `test_chat.py`'s cross-user test now asserts the corrected 403. | Both bugs were pre-existing, not introduced by this session's Phase 4 work. Fixed on explicit user request after being flagged; the ownership-check fix is a real security-relevant correctness fix (previously any two users got the same "not found" response, obscuring the access-control distinction API consumers rely on `api-standards.md`'s `FORBIDDEN` code for). |
| 2026-08-18 | Telegram bot-linking uses a **short-lived signed JWT** (`utils/security.py`'s new `create_purpose_token()`/`decode_purpose_token()`, 15 min expiry, `purpose="telegram_link"` claim) embedded in the `/start` deep link (`https://t.me/<TELEGRAM_BOT_USERNAME>?start=<token>`) instead of a new DB-backed linking-token table. `POST /api/v1/telegram/webhook` decodes the token from the `/start <token>` message text, verifies its purpose, and writes `chat.id` to that user's `telegram_chat_id`. | No new table/migration needed for a value that only has to survive ~15 minutes and is single-use by construction (a fresh token replaces the old one on every `GET /telegram/link` call); reuses the same JWT infra already trusted for access tokens, just with a distinct `purpose` claim so a link token can never be replayed as an API access token or vice versa. |
| 2026-08-18 | `GET /api/v1/telegram/link` returns `deep_link: null` (not an error) when `TELEGRAM_BOT_USERNAME` isn't configured yet, and the webhook only enforces `TELEGRAM_WEBHOOK_SECRET` header-matching when that setting is non-empty. `notification_service.send_message()` similarly no-ops (logs, doesn't raise) when `TELEGRAM_BOT_TOKEN` is unset. | Mirrors the existing `ELEVENLABS_API_KEY`/`GOOGLE_PLACES_API_KEY`-style optional-config pattern elsewhere in the app — the feature degrades to inert rather than breaking auth or the assessment-creation path before a bot is actually provisioned. |
| 2026-08-18 | `assessment_service.create()` now takes the full `User` object (was `user_id`) and an injected `NotificationService`; after a successful save, if `user.telegram_chat_id` is set, it fires `asyncio.create_task(notification_service.send_assessment_report(...))` without awaiting it. | Build plan requires delivery to be "fire-and-forget... never blocks response." `create_task` schedules the coroutine on the already-running event loop and returns immediately, so a slow/unreachable Telegram API can't add latency to `POST /assessments/`; `send_assessment_report()`/`send_message()` never raise (only log), so the un-awaited task can't produce an "exception was never retrieved" warning either. |
| 2026-08-18 | `clinic_service.py` calls Google's Nearby Search (name/address/rating/location only — no phone) and then, for at most the 10 closest results, a per-place Details call (`fields=formatted_phone_number`) run concurrently via `asyncio.gather`; distance is computed client-side with a haversine formula rather than trusting any distance field from Google (Nearby Search doesn't return one). Results beyond the 10th closest come back with `phone: null` rather than triggering more Details calls. | `ui-rules.md`/build-plan's frontend spec wants name, address, rating, distance, **and phone** in the clinic list, but Places Nearby Search doesn't include phone at all — Place Details is the only way to get it, and it's a separate billed call per place, so the lookup is capped instead of run for an unbounded result set. |
| 2026-08-18 | Phase 4 frontend: the free-text intake panel (`SymptomIntakeChat.jsx`) lives directly under the step header on `NewAssessmentPage.jsx` — outside the per-step conditional block — so it applies regardless of which of the 4 steps is active, and merges only the keys `/chat/intake` actually returned into `symptoms` state (via a new `handleIntakeApply`), rather than resetting the whole form. Freshly-applied keys get a small "AI" badge on their `SymptomToggle` (new optional `aiFilled` prop) via an `aiFilledKeys` Set that's cleared per-key the moment the user manually touches that toggle. `ChatPanel.jsx` on `ResultPage.jsx` reuses `utils/speech.js`'s existing `speak()`/`stopSpeaking()` (same one `AiGuide.jsx` uses) rather than introducing a second TTS path, with a speaker-icon toggle (default on) so "optionally speaks" is a real per-message choice, not just a fixed autoplay. | Matches the existing pattern of "AI suggests, user reviews/overrides" already established for CV-detected symptoms in `assessment_service.py`; sharing `speak()` keeps Dr. Ava's voice behavior (real ElevenLabs TTS → browser `SpeechSynthesis` fallback) identical across every surface that uses it instead of a chat-specific reimplementation. |
| 2026-08-18 | Verified live via Playwright (no `chromium-cli` available in this Windows dev environment, so used a raw `playwright` Node driver script against the already-running Vite+FastAPI dev servers instead) that: the intake panel correctly posts to `/chat/intake` and renders the graceful `LLM_SERVICE_UNAVAILABLE` message (no `LLM_API_KEY` configured in this dev `.env`); a full 4-step assessment still submits normally with the panel open; and `ChatPanel` on the resulting `ResultPage` posts to `/chat/explain` and renders the same graceful error, with only the expected `503` console noise (no real JS exceptions) via `console --errors`-equivalent event capture. | Confirms the full frontend↔backend wiring for both endpoints end-to-end, including the "AI unavailable" degrade path (the only path testable without a real `LLM_API_KEY`) — the happy-path answer rendering was verified by code review only, since no LLM key is configured in this environment. |
| 2026-08-18 | Phase 5 frontend: `TelegramLinkCard.jsx` lives on `DashboardPage.jsx` (build-plan allowed either "settings or dashboard" — no settings page exists in this app) and always calls `GET /telegram/link` fresh on mount and on its "I've linked it — refresh" button, since the backend hands back a brand-new short-lived deep link on every call rather than a stable one to cache. `NearbyClinics.jsx` on `ResultPage.jsx` requests `navigator.geolocation.getCurrentPosition()` only when the user clicks "Find nearby clinics" (not on page load), with distinct friendly messages per `GeolocationPositionError.code` (denied/unavailable/timeout) versus the backend's `CLINIC_SERVICE_UNAVAILABLE`. | Browsers gate `getCurrentPosition` behind a user gesture in practice and a bare permission prompt on page load reads as intrusive; matches the same "ask only when needed, degrade gracefully" pattern as the Phase 4 chat/intake work. |
| 2026-08-18 | Found and fixed a bug during live testing: `NearbyClinics.jsx`'s original error handling used `'code' in err` to distinguish a `GeolocationPositionError` (codes 1/2/3) from an axios HTTP error, but axios error objects also carry a `.code` property (e.g. `"ERR_BAD_REQUEST"`), so a real `503 CLINIC_SERVICE_UNAVAILABLE` from the backend was being misrouted into the geolocation-error branch and shown as the generic axios message ("Request failed with status code 503") instead of the backend's actual error text. Fixed by separating the two `try/catch` blocks (geolocation call vs. API call) so each error is handled unconditionally by the right branch, with no runtime type-sniffing needed. | Caught via the live Playwright run (mocked geolocation coordinates, no `GOOGLE_PLACES_API_KEY` configured) — the UI showed the wrong error text where the correct one should read "Nearby clinic search is temporarily unavailable." A pure code-review pass would likely have missed this, since both branches "look" like reasonable error handling in isolation. |
| 2026-08-20 | Fixed a reported Live Screening bug ("camera doesn't show anything after answering the questions"): `GuidedCapture.jsx`'s `cameraStatus` had no path out of `'requesting'` other than the `getUserMedia()` promise itself settling — if a real browser's permission prompt is shown as a small, easy-to-miss address-bar icon (not a modal) and the user doesn't respond to it right away, that promise sits pending indefinitely and the screen shows nothing but a bare "Turning on your camera…" spinner forever, which reads as "not showing anything" in a live demo. Added a 6-second timer (new `slowRequest` state) that reveals a "Skip camera, upload a photo instead" escape hatch without touching the still-pending permission request; a new `skippedRef` guards against that request resolving to `'granted'` *after* the user already skipped past it. | Verified live via Playwright three ways: (1) the original fast path (fake camera device, permission pre-granted) still reaches the working live camera UI unchanged; (2) stubbing `navigator.mediaDevices.getUserMedia` via `page.addInitScript` to return a promise that never resolves — deterministically reproducing the reported symptom — confirmed the spinner alone shows first, the escape hatch appears at ~6s, and clicking it correctly falls through to the existing `PhotoUpload` fallback; (3) real headless Chromium without granted permission (no fake-device flags) showed the exact timing is unpredictable in practice (resolved to `'denied'` anywhere from ~0.5s to 10s+ across runs) — consistent with a real permission prompt's resolution time being outside the app's control, which is what motivated the timeout rather than trying to detect "prompt is pending" directly (no such browser API exists). |
