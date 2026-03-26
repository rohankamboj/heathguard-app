# HealthGuard — Backend API

FastAPI service for role-based authentication, user management, encrypted patient data, and Excel uploads. It exposes JSON under the `/api` prefix and serves interactive docs at `/api/docs`.

For full-stack Docker setup, demo accounts, and project overview, see the [root README](../README.md).

## Requirements

- Python 3.11+
- PostgreSQL 14+ (running and reachable via `DATABASE_URL`)

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

- Set `DATABASE_URL` for local development (for example `postgresql://postgres:postgres@localhost:5432/healthguard`). The example file uses hostname `db`, which matches Docker Compose, not a bare-metal Postgres on your machine.
- Set `SECRET_KEY` (for example `openssl rand -hex 32`).
- Set `ENCRYPTION_KEY` to a base64-encoded 32-byte key, for example:

  ```bash
  python -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
  ```

Create tables and load demo data:

```bash
python seed.py
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

run using docker
```
cd "/Users/rohan/Downloads/ncaremd project"
docker compose up -d --build db backend
```

- Health: `GET http://localhost:8000/api/health`
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Tests

```bash
pytest
```

## Layout

| Path | Role |
|------|------|
| `app/main.py` | FastAPI app, middleware, router mounting |
| `app/api/` | Route modules (`auth`, `users`, `patients`, `dashboard`) |
| `app/core/` | Settings, DB, security, encryption, dependencies |
| `app/models/`, `app/schemas/` | SQLAlchemy models and Pydantic schemas |
| `seed.py` | Creates schema and seeds roles, users, locations, sample patients |

## CORS

Default allowed origins include `http://localhost:5173` and `http://localhost:3000`. To allow another dev origin, extend `ALLOWED_ORIGINS` in `app/core/config.py` or wire it through settings if you add env-based configuration.

## Docker

A `Dockerfile` is provided in this folder for container builds. Orchestration with the database and frontend is described in the repository root.
