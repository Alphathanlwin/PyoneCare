# OHAS backend — FastAPI + SWI-Prolog.
#
# The diagnosis engine (services/prolog_service.py) shells out to the `swipl`
# binary via asyncio.create_subprocess_exec, so the image must ship SWI-Prolog
# on PATH — this is why the backend is deployed as a container rather than on a
# buildpack platform.
FROM python:3.11-slim

# swi-prolog: the risk engine binary. build-essential + libpq-dev: not strictly
# needed for asyncpg wheels, kept out to keep the image small. curl: healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends swi-prolog curl \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render mounts the persistent disk here (see render.yaml). Create it so the
# path exists even before the disk is attached / in local runs.
RUN mkdir -p /app/uploads

EXPOSE 8000

# Render sets $PORT. Fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
