import asyncio
import logging
import sys

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import assessment, auth, chat, clinic, telegram
from utils.response import error_response

logger = logging.getLogger(__name__)

if sys.platform == "win32":
    # prolog_service.py uses asyncio.create_subprocess_exec, which requires
    # ProactorEventLoop on Windows (the default loop). Run this server
    # WITHOUT --reload: uvicorn's --reload spawns the worker via
    # multiprocessing, which on Windows ends up on a loop that doesn't
    # support subprocesses at all, breaking every Prolog-backed request with
    # a bare NotImplementedError. See README.md.
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI(title="OHAS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    # Also allow the dev machine's LAN IP on the same port, so the frontend
    # is reachable from a phone on the same Wi-Fi (192.168.x.x / 10.x.x.x).
    allow_origin_regex=r"http://(192\.168|10)\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(assessment.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(telegram.router, prefix="/api/v1/telegram", tags=["Telegram"])
app.include_router(clinic.router, prefix="/api/v1/clinics", tags=["Clinics"])


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc.detail["code"], exc.detail["message"]),
        )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response("REQUEST_ERROR", str(exc.detail)),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = exc.errors()
    first_error = details[0] if details else {}
    loc = first_error.get("loc", [])
    field_name = str(loc[-1]) if loc else "body"
    message = first_error.get("msg", "Invalid request payload.")
    return JSONResponse(
        status_code=422,
        content=error_response("VALIDATION_ERROR", f"Invalid value for '{field_name}': {message}"),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=error_response("INTERNAL_SERVER_ERROR", "An unexpected server error occurred. Please try again later."),
    )


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
