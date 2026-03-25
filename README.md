# HealthGuard — Full-Stack Healthcare Platform

A production-grade full-stack application implementing role-based authentication (Assignment 1) and encrypted patient data management (Assignment 2), built with **FastAPI**, **React + Vite**, **PostgreSQL**, and **Docker**.

---

## Quick Start (One Command)

```bash
git clone <repo>
cd healthguard
bash setup.sh
```

The script will:
1. Check for `docker` and `python3`
2. Auto-generate a `.env` with fresh **JWT secret** and **AES-256 encryption key**
3. Build and start all containers
4. Wait for services to be healthy
5. Seed the database with demo users and patient data

**Then open:** http://localhost:5173

---

## Demo Credentials

| Role    | Username    | Password      | Access |
|---------|-------------|---------------|--------|
| Admin   | `admin`     | `Admin@123!`  | Full system — all users, all locations |
| Manager | `mgr_us`    | `Manager@123!`| US location — patient data with 15 seeded records |
| Manager | `mgr_in`    | `Manager@123!`| IN location |
| Manager | `mgr_eu`    | `Manager@123!`| EU location |
| Manager | `mgr_au`    | `Manager@123!`| AU location |
| User    | `user_us_ar`| `User@1234!`  | Personal dashboard only |

---

## Manual Setup (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — update DATABASE_URL, generate keys:
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python -c "import base64,os; print('ENCRYPTION_KEY=' + base64.b64encode(os.urandom(32)).decode())"

# 4. Create DB tables and seed data
python seed.py

# 5. Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/healthguard` |
| `SECRET_KEY` | JWT signing key (32 hex bytes) | Auto-generated |
| `ENCRYPTION_KEY` | AES-256 key (32 bytes, base64) | Auto-generated |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token lifetime | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `MAX_LOGIN_ATTEMPTS` | Failed attempts before lockout | `5` |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration | `15` |
| `BCRYPT_ROUNDS` | Password hashing cost | `12` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit per IP | `60` |
| `MAX_UPLOAD_SIZE_MB` | Max Excel file size | `50` |
| `MAX_RECORDS_PER_UPLOAD` | Max rows per upload | `10000` |

---

## Project Structure

```
healthguard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Login, logout, refresh, /me
│   │   │   ├── users.py         # User CRUD, roles/locations/teams
│   │   │   ├── patients.py      # Excel upload, patient CRUD + encryption
│   │   │   └── dashboard.py     # Role-scoped stats
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings
│   │   │   ├── database.py      # SQLAlchemy engine + session
│   │   │   ├── security.py      # JWT, bcrypt, password validation
│   │   │   ├── encryption.py    # AES-256-GCM field-level encryption
│   │   │   └── deps.py          # Auth dependencies, role guards, audit logger
│   │   ├── models/models.py     # All SQLAlchemy models
│   │   ├── schemas/schemas.py   # All Pydantic schemas
│   │   └── main.py              # FastAPI app, middleware, routers
│   ├── tests/test_core.py       # Unit tests
│   ├── seed.py                  # Database seeder
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/LoginPage.jsx
│   │   │   ├── shared/
│   │   │   │   ├── UI.jsx       # Button, Input, Badge, Modal, Card, StatCard
│   │   │   │   └── AppLayout.jsx# Sidebar nav with role-based items
│   │   │   ├── dashboard/UsersTable.jsx
│   │   │   └── patient/
│   │   │       ├── PatientUpload.jsx  # Drag & drop Excel uploader
│   │   │       └── PatientTable.jsx   # Inline-editing patient table
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsersPage.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── PatientsPage.jsx
│   │   │   └── UserDashboard.jsx
│   │   ├── services/api.js       # Axios client with token refresh
│   │   ├── store/authStore.js    # Zustand auth state
│   │   ├── App.jsx               # React Router + guards
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── sample_data/
│   ├── sample_patients.xlsx           # 20 valid patient records
│   └── sample_patients_with_errors.xlsx # 4 rows: 3 errors, 1 valid
├── docker-compose.yml
├── docker-compose.prod.yml
└── setup.sh
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `roles` | Configurable roles (admin, manager, user + extensible) |
| `permissions` | Granular permission definitions |
| `role_permissions` | Many-to-many role ↔ permission mapping |
| `locations` | US, IN, EU, AU + extensible |
| `teams` | AR, EPA, PRI + extensible |
| `users` | Core user table with lockout tracking |
| `patients` | Encrypted PHI storage |
| `patient_upload_batches` | Tracks each Excel upload |
| `audit_logs` | All login/logout/data access events |

### Entity Relationships

```
roles ──< role_permissions >── permissions
roles ──< users >── locations
            │
            └──> teams
            └──> patient_upload_batches ──< patients
            └──> audit_logs
```

---

## API Documentation

Interactive Swagger UI: **http://localhost:8000/api/docs**

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → access + refresh tokens |
| POST | `/api/auth/logout` | Invalidate session (audit logged) |
| POST | `/api/auth/refresh` | Rotate access token |
| GET  | `/api/auth/me` | Current user profile |

### User Endpoints (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List users (with filters) |
| POST | `/api/users/` | Create user |
| GET | `/api/users/{id}` | Get user |
| PATCH | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Deactivate user |
| POST | `/api/users/{id}/unlock` | Unlock locked account |
| GET | `/api/users/meta/roles` | Available roles |
| GET | `/api/users/meta/locations` | Available locations |
| GET | `/api/users/meta/teams` | Available teams |

### Patient Endpoints (Manager only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patients/upload` | Upload Excel file (encrypts on ingest) |
| GET | `/api/patients/` | List patients (decrypts on read) |
| GET | `/api/patients/batches` | List upload batches |
| GET | `/api/patients/{id}` | Get single patient |
| PATCH | `/api/patients/{id}` | Inline edit (re-encrypts) |
| DELETE | `/api/patients/{id}` | Soft delete |

### Dashboard Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Role-scoped statistics |
| GET | `/api/dashboard/users` | Role-scoped user list |

---

## Security Implementation

### Authentication
- **JWT tokens** (access + refresh) via `python-jose`
- Access tokens expire in 60 minutes; refresh tokens in 7 days
- Automatic token refresh via Axios interceptor — seamless for users
- Session cleanup on logout with audit trail

### Password Security
- **bcrypt** with 12 rounds (configurable)
- Password policy: min 8 chars, upper + lower + digit + special character
- Account lockout after 5 failed attempts for 15 minutes
- Auto-unlock when lockout window expires

### Application-Level Encryption (AES-256-GCM)

**Why AES-256-GCM?**
- Authenticated encryption: provides both confidentiality AND integrity
- GCM mode detects tampering (auth tag verification)
- Industry standard for healthcare data

**Field-level encryption design:**
```
Plaintext → AES-256-GCM(key, random_IV) → base64(IV + ciphertext + auth_tag) → DB
```

Each encrypted value stores: `base64(12-byte IV + ciphertext + 16-byte GCM tag)`

**Encrypted fields:** `first_name`, `last_name`, `date_of_birth`, `gender`

**Why `patient_id` is NOT encrypted:**
> Patient ID is a pseudonymous alphanumeric identifier (e.g., "PT-001") with no direct PHI. Encrypting it would prevent database indexing and range queries, significantly impacting performance for 10,000+ record tables. Per HIPAA Safe Harbor (45 CFR §164.514(b)), account numbers and identifiers assigned by covered entities may be retained if they don't directly identify the individual. The patient_id here is an internal system identifier, not a social security number, NHS number, or other government ID.

**Key management:**
- Key stored in `.env` / environment variable (never in code)
- 32-byte key generated fresh per deployment via `setup.sh`
- Key rotation: generate new key → re-encrypt all records → update env → restart
- In production: use AWS Secrets Manager / HashiCorp Vault / Azure Key Vault

### Other Security Measures
- **SQL Injection**: SQLAlchemy ORM with parameterized queries
- **XSS**: React's JSX auto-escaping; no dangerouslySetInnerHTML
- **CSRF**: JWT Bearer token (not cookies) — immune to CSRF by design
- **Rate limiting**: SlowAPI — 60 req/min per IP
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- **CORS**: Explicit allowed origins list
- **Input validation**: Pydantic schemas on all endpoints
- **Audit trail**: Every login, logout, data access, and modification logged

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v

# With coverage
pip install pytest-cov
pytest tests/ -v --cov=app --cov-report=term-missing
```

Test coverage includes:
- Password hashing & verification
- bcrypt uniqueness (random salt)
- Password strength validation (7 parametrized cases)
- JWT creation, decode, type checking, invalid tokens
- AES-256-GCM encrypt/decrypt roundtrip
- Random IV uniqueness
- None value passthrough
- Full patient record encrypt/decrypt
- Key length validation
- Wrong-key tamper detection
- Patient ID, gender, DOB schema validation (15+ parametrized cases)

---

## Sample Data Files

| File | Contents |
|------|----------|
| `sample_data/sample_patients.xlsx` | 20 valid patient records across all genders |
| `sample_data/sample_patients_with_errors.xlsx` | 4 rows: missing first name, bad date, invalid gender, 1 valid |

Upload via **Manager dashboard → Patient Data → Upload File**.

---

## Architecture Decisions

### Why FastAPI?
- Native async support for high-concurrency uploads
- Automatic OpenAPI/Swagger documentation
- Pydantic integration for bulletproof input validation
- Type hints throughout for maintainability

### Why Zustand over Redux?
- Minimal boilerplate for auth state
- Built-in persistence middleware for session survival on page refresh
- React Query handles all server state (users, patients) — Zustand only manages auth

### Why React Query?
- Automatic cache invalidation after mutations
- Built-in loading/error states
- `keepPreviousData` for smooth pagination

### Why PostgreSQL?
- ACID compliance critical for healthcare data
- Strong support for future JSON fields (audit details)
- Robust with SQLAlchemy ORM

### Searchability with Encrypted Data
Searching encrypted fields requires full-table scan + decrypt-compare, which is O(n). The system searches on `patient_id` (unencrypted index) for O(log n) performance. For full-name search at scale, options are: (1) deterministic encryption for exact-match, (2) blind indexing (HMAC of value), or (3) a separate search service. Current implementation is appropriate for the 10,000-record requirement.

---

## Production Checklist

- [ ] Set strong `SECRET_KEY` and `ENCRYPTION_KEY` via secrets manager
- [ ] Use `docker-compose.prod.yml` for nginx-served frontend
- [ ] Enable HTTPS (TLS termination at load balancer or nginx)
- [ ] Set `DEBUG=false` and `ENVIRONMENT=production`
- [ ] Configure `ALLOWED_ORIGINS` to your actual domain
- [ ] Set up PostgreSQL with connection pooling (PgBouncer)
- [ ] Configure log aggregation (CloudWatch / Datadog)
- [ ] Schedule automated DB backups
- [ ] Implement encryption key rotation procedure
