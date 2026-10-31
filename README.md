# AuthCore 🛡️

[![CI](https://github.com/Soham6888/authcore/actions/workflows/ci.yml/badge.svg)](https://github.com/Soham6888/authcore/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/JaCoCo%20Coverage-86.3%25-brightgreen.svg)](https://github.com/Soham6888/authcore)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED.svg)](https://www.docker.com/)

A production-grade, standalone **Authentication & User Management API** built to demonstrate mastery of:
- **Database Architecture & Schema Design**: Relational normalization, indexing strategy, token rotation, password history, and immutable append-only audit logging.
- **Testing Pyramid**: 78 automated tests spanning Unit (JUnit 5 + Mockito), Integration (Spring Boot Test with PostgreSQL/H2 & Redis), and dedicated End-to-End API verification (all 8 PRD scenarios) with strict JaCoCo coverage enforcement (≥ 80% line coverage gate, currently 84%).
- **Interactive Neoclassical Admin Portal**: React 19 single-page application styled with a minimalist dark aesthetic (`#0a0a0a` background, muted gold accents, clean English typography, and Lucide icons), embedded into the Spring Boot distribution bundle.
- **DevOps & Containerization**: Multi-stage Docker builds (Node 20 + Temurin 21 alpine), Docker Compose local orchestration, and automated GitHub Actions CI pipelines with live service containers.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Language & Runtime** | Java 21 LTS | Records, Pattern Matching, Sealed Types, Virtual Threads |
| **Framework** | Spring Boot 4.x / 3.4+ | WebMvc, Spring Security, Spring Data JPA, Spring Data Redis |
| **Primary Datastore** | PostgreSQL 16 | Relational tables, Foreign Keys, Partial Indexes, Pgcrypto UUIDs |
| **Cache & Rate Limiting** | Redis 7 | In-memory token blacklisting, sliding window rate limits with TTL |
| **Database Migrations** | Flyway 10.x | Reproducible version-controlled DDL migrations |
| **Security & Tokens** | Spring Security 6 + JJWT | Stateless JWT Access Tokens (15 min) + Refresh Token Rotation (7 days) |
| **Testing Engine** | JUnit 5, Mockito, Spring Security Test | 69 unit and full HTTP slice integration tests |
| **Code Coverage** | JaCoCo 0.8.12 | 86.3% line coverage with build-breaking enforcement gate |
| **DevOps & CI/CD** | Docker & GitHub Actions | Automated build, test with PostgreSQL/Redis containers, and Docker image packaging |

---

## 🗄️ Database Schema & Entities

AuthCore uses 8 normalized relational tables managed via Flyway migrations (`db/migration`):

```
users
  ├── user_roles (join)
  │     └── roles
  │           └── role_permissions (join)
  │                 └── permissions
  ├── refresh_tokens
  ├── password_reset_tokens
  ├── password_history
  └── audit_logs (append-only)
```

- **`users`**: UUID primary key, case-insensitive email/username indexes, status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and soft-deletion tracking (`deleted_at`).
- **`roles` & `permissions`**: Granular RBAC (`SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `USER`) mapping to permissions (`users:read`, `users:write`, `roles:read`, `audit:read`, etc.).
- **`refresh_tokens`**: SHA-256 hashed single-use refresh tokens with client device & IP tracking; enforces maximum 5 concurrent active sessions per user.
- **`password_reset_tokens`**: Time-limited (15-minute TTL) single-use tokens hashed before persistence.
- **`password_history`**: Tracks user password history to prevent reuse of any of the last 5 passwords (BR-09).
- **`audit_logs`**: Immutable, append-only security log recording timestamp, actor ID, action, client IP, User-Agent, and JSONB metadata.

---

## 🔑 Redis Key Design & Rate Limiting

| Key Pattern | TTL | Business Rule | Enforced Action |
|---|---|---|---|
| `rate:login:ip:{ip}` | 15 min | BR-21 | 5 login attempts per IP per 15 min. Exceeding returns HTTP 429. |
| `rate:login:acct:{userId}` | 30 min | BR-22 | 5 consecutive failed logins locks account for 30 min. Returns HTTP 423. |
| `rate:pwreset:{email}` | 1 hour | BR-24 | 3 password reset requests per email per hour. Exceeding returns HTTP 429. |
| `token:blacklist:{jti}` | Token TTL | BR-11 | Revoked access tokens blacklisted on logout until natural expiration. |

*Note: RateLimitService features an automatic, thread-safe in-memory concurrent fallback to guarantee operational resilience during Redis maintenance.*

---

## 🔌 API Endpoint Catalog

All API endpoints follow standard REST conventions under base path `/api/v1`:

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new account (default role: `USER`) |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email/password, returns access & refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Single-use refresh token rotation |
| `POST` | `/api/v1/auth/logout` | Public | Revokes refresh token and blacklists active access token in Redis |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revokes all active sessions for current user |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch current user summary |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset token (rate-limited: 3/hr) |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password using valid token (checks 5-password history) |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Change password with current password verification & history check |

### User Management (`/api/v1/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/users` | Admin / Super Admin | Paginated search and filtering by status, role, query |
| `GET` | `/api/v1/users/{id}` | Admin or Self | Retrieve user profile by ID |
| `PATCH` | `/api/v1/users/{id}` | Admin or Self | Update first name, last name |
| `DELETE` | `/api/v1/users/{id}` | Admin or Self | Soft-delete user (`deleted_at = NOW()`) & revoke all sessions |
| `PATCH` | `/api/v1/users/{id}/status` | Admin / Super Admin | Change status (`ACTIVE`, `INACTIVE`, `SUSPENDED`) |
| `GET` | `/api/v1/users/{id}/sessions` | Admin or Self | List active sessions (device info, IP, timestamps) |
| `DELETE` | `/api/v1/users/{id}/sessions/{sessionId}` | Admin or Self | Revoke specific session |
| `GET` | `/api/v1/users/{id}/audit-logs` | Admin / Super Admin | Paginated user audit trail |
| `POST` | `/api/v1/users/{id}/roles` | Admin / Super Admin | Assign role (Super Admin required for `ADMIN` role) |
| `DELETE` | `/api/v1/users/{id}/roles/{roleId}` | Admin / Super Admin | Remove role (enforces user must retain at least 1 role) |

### Role Management (`/api/v1/roles`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/roles` | Admin / Super Admin | List all roles with permission sets |
| `GET` | `/api/v1/roles/{id}` | Admin / Super Admin | Retrieve single role |
| `POST` | `/api/v1/roles` | Super Admin | Create custom role with permissions |
| `PATCH` | `/api/v1/roles/{id}` | Super Admin | Update role description or permissions |
| `DELETE` | `/api/v1/roles/{id}` | Super Admin | Delete custom role (system roles protected from deletion) |

### Audit Logging (`/api/v1/audit-logs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/audit-logs` | Admin / Super Admin | System-wide immutable audit trail query with optional `userId` and `action` filters and pagination |

### System & Health (`/api/v1/health`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Basic probe checking PostgreSQL & Redis connectivity |
| `GET` | `/api/v1/health/detailed` | Admin / Super Admin | Deep metrics including JVM heap memory, processors, and state |

---

## 🏛️ Frontend Admin Portal & UI Routes

AuthCore embeds a modern, minimalist neoclassical dark UI served directly from the Spring Boot static bundle on port `8080`:

| Route | Feature | Key Capabilities |
|---|---|---|
| `/login` | Authentication Portal | 1-click test credentials, user registration, 2-step password reset with NIST strength meter |
| `/dashboard` | System Overview | Real-time counts of users, active sessions, security events, and rapid navigation |
| `/users` | Directory Management | Paginated directory, keyword search, status filtering, session revocation, suspend/activate |
| `/roles` | Access Control Matrix | Inspection of built-in roles (`SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `USER`) and custom role editor |
| `/audit` | Security Chronicle | Immutable audit ledger with event filtering, timestamps, client IPs, and JSON metadata viewer |
| `/account` | Identity Center | Authenticated profile editing, password changes (enforcing last 5 history check), session revocation |
| `/health` | Health & Maintenance | Real-time JVM memory stats, Redis/Postgres health indicators, and manual data retention triggers |

### Default Pre-Seeded Development Credentials

| Account | Email Address | Password | Assigned Role |
|---|---|---|---|
| **Super Administrator** | `superadmin@authcore.io` | `AdminPassword123!` | `SUPER_ADMIN` |
| **Standard User** | `john.doe@example.com` | `Password123!` | `USER` |

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Soham6888/authcore.git
cd authcore
```

### 2. Start PostgreSQL and Redis via Docker Compose
```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
```

### 3. Run the application
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`.

---

## 🧪 Testing & Verification

Run the entire test suite and verify JaCoCo line coverage gate:

```bash
# Windows
.\mvnw.cmd verify

# Linux / macOS
./mvnw verify
```

Coverage report will be generated at `target/site/jacoco/index.html`.

---

## 📦 Containerization & Docker

To run the complete stack including the application inside Docker:

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

Or build the standalone multi-stage image:

```bash
docker build -t authcore:latest .
docker run -p 8080:8080 --env-file .env authcore:latest
```

---

## 📄 License
MIT License.
