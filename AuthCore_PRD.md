# AuthCore — Product Requirements Document
> Version 1.0 · 2026-10-15 · Status: **Active**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Business Rules](#2-business-rules)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Tech Stack](#5-tech-stack)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [UI Design Structure](#8-ui-design-structure)
9. [Testing Strategy](#9-testing-strategy)
10. [DevOps & CI/CD](#10-devops--cicd)
11. [Project Structure](#11-project-structure)
12. [Milestones](#12-milestones)

---

## 1. Project Overview

**AuthCore** is a production-grade, standalone **Authentication & User Management API** built to demonstrate mastery of:
- Relational database design with caching
- Comprehensive test coverage (unit → integration → e2e)
- Containerized deployment with automated CI/CD

It is designed to be consumed by any frontend or microservice as an **auth provider** — similar to how you would integrate an internal identity service in a real company.

### Goals
- Serve as a reference implementation of auth best practices
- Cover every layer of the testing pyramid
- Be fully containerized and deployable end-to-end via CI/CD
- Demonstrate real schema design: normalization, indexes, audit trails

---

## 2. Business Rules

### 2.1 User Identity
- **BR-01:** Every user must have a **unique email address** (case-insensitive).
- **BR-02:** Every user must have a **unique username** (case-insensitive, 3–30 chars, alphanumeric + underscore only).
- **BR-03:** A user account can be in one of three states: `ACTIVE`, `INACTIVE`, `SUSPENDED`.
- **BR-04:** Only `ACTIVE` users may authenticate.
- **BR-05:** A `SUSPENDED` user must receive a specific error message, not a generic auth failure.

### 2.2 Password Policy
- **BR-06:** Passwords must be **minimum 8 characters**.
- **BR-07:** Passwords must contain at least one **uppercase letter**, one **lowercase letter**, one **digit**, and one **special character**.
- **BR-08:** Passwords are stored as **bcrypt hashes** (cost factor ≥ 12). Plaintext is never persisted.
- **BR-09:** Password history is tracked — a user **cannot reuse their last 5 passwords**.
- **BR-10:** A password reset link is valid for **15 minutes only** and is **single-use**.

### 2.3 Authentication & Sessions
- **BR-11:** Authentication uses **JWT access tokens** (short-lived: 15 minutes).
- **BR-12:** **Refresh tokens** are long-lived (7 days), stored in the database, and rotated on every use.
- **BR-13:** A user may have a maximum of **5 concurrent active sessions**. Oldest session is invalidated on exceeding limit.
- **BR-14:** Logout invalidates the specific session's refresh token only. Logout-all invalidates all sessions.
- **BR-15:** Refresh tokens are **hashed before storage** in the database.

### 2.4 Role-Based Access Control (RBAC)
- **BR-16:** Every user is assigned at least one **role**. Default role on registration: `USER`.
- **BR-17:** Built-in system roles: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `USER`. These cannot be deleted.
- **BR-18:** Roles have **permissions** assigned to them. Permissions are defined as `resource:action` strings (e.g., `users:read`, `users:write`).
- **BR-19:** A user can have multiple roles. Permissions are the **union** of all their roles' permissions.
- **BR-20:** Only `SUPER_ADMIN` can assign the `ADMIN` role.

### 2.5 Rate Limiting
- **BR-21:** Login attempts are rate-limited to **5 attempts per IP per 15 minutes**.
- **BR-22:** On 5 consecutive failed login attempts for a specific account, that account is **temporarily locked for 30 minutes**.
- **BR-23:** Rate limit state is stored in **Redis** with TTL.
- **BR-24:** Password reset requests are rate-limited to **3 per email per hour**.

### 2.6 Audit Logging
- **BR-25:** Every **security-relevant action** is written to an audit log: login, logout, password change, role change, account suspension, token refresh, failed login.
- **BR-26:** Audit logs include: `user_id`, `action`, `ip_address`, `user_agent`, `timestamp`, `metadata` (JSON).
- **BR-27:** Audit logs are **append-only** — no update or delete operations are permitted on this table.
- **BR-28:** Audit logs older than **90 days** are archived (soft-delete flag).

### 2.7 Data Privacy
- **BR-29:** A user can **request their own account deletion** (soft delete — `deleted_at` timestamp set, data retained for 30 days).
- **BR-30:** After 30 days of soft deletion, a scheduled job **hard-deletes** the record and anonymizes audit logs.

---

## 3. Functional Requirements

### 3.1 Authentication Module

| ID | Requirement |
|---|---|
| FR-01 | `POST /auth/register` — Register a new user account |
| FR-02 | `POST /auth/login` — Authenticate with email + password, return access + refresh tokens |
| FR-03 | `POST /auth/refresh` — Exchange a valid refresh token for a new access token (token rotation) |
| FR-04 | `POST /auth/logout` — Invalidate the current session's refresh token |
| FR-05 | `POST /auth/logout-all` — Invalidate all sessions for the authenticated user |
| FR-06 | `POST /auth/forgot-password` — Send password reset link to registered email |
| FR-07 | `POST /auth/reset-password` — Set new password using a valid reset token |
| FR-08 | `POST /auth/change-password` — Change password when authenticated (requires current password) |
| FR-09 | `GET  /auth/me` — Return profile of the currently authenticated user |

### 3.2 User Management Module

| ID | Requirement |
|---|---|
| FR-10 | `GET    /users` — List all users (paginated, filterable) — Admin only |
| FR-11 | `GET    /users/{id}` — Get user by ID — Admin or self |
| FR-12 | `PATCH  /users/{id}` — Update user profile fields — Admin or self |
| FR-13 | `DELETE /users/{id}` — Soft-delete a user account — Admin or self |
| FR-14 | `PATCH  /users/{id}/status` — Change user status (ACTIVE/INACTIVE/SUSPENDED) — Admin only |
| FR-15 | `GET    /users/{id}/sessions` — List active sessions for a user — Admin or self |
| FR-16 | `DELETE /users/{id}/sessions/{sessionId}` — Revoke a specific session — Admin or self |
| FR-17 | `GET    /users/{id}/audit-logs` — View audit logs for a user — Admin only |

### 3.3 Role & Permission Module

| ID | Requirement |
|---|---|
| FR-18 | `GET    /roles` — List all roles with their permissions |
| FR-19 | `POST   /roles` — Create a new role — Super Admin only |
| FR-20 | `PATCH  /roles/{id}` — Update role name or permissions — Super Admin only |
| FR-21 | `DELETE /roles/{id}` — Delete a non-system role — Super Admin only |
| FR-22 | `POST   /users/{id}/roles` — Assign role(s) to a user — Admin/Super Admin |
| FR-23 | `DELETE /users/{id}/roles/{roleId}` — Remove a role from a user — Admin/Super Admin |

### 3.4 Health & Admin Module

| ID | Requirement |
|---|---|
| FR-24 | `GET /health` — Public health check (returns DB + Redis status) |
| FR-25 | `GET /health/detailed` — Detailed metrics — Admin only |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | API p99 latency < 200ms under normal load |
| **Availability** | Health endpoint must always respond, even if DB is down |
| **Security** | No secrets in source code. All secrets via environment variables |
| **Security** | SQL injection prevention — use parameterized queries only (JPA/Hibernate) |
| **Security** | All endpoints except `/auth/register`, `/auth/login`, `/health` require valid JWT |
| **Security** | HTTPS enforced in production. HTTP → HTTPS redirect |
| **Observability** | Structured JSON logging with correlation ID per request |
| **Scalability** | Stateless API — no in-memory session state. All state in DB/Redis |
| **Testability** | Minimum 80% line coverage across all modules |
| **Portability** | Runs identically via Docker locally and in CI |

---

## 5. Tech Stack

### 5.1 Core

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Language | Java | 21 LTS | Modern features: records, sealed classes, virtual threads |
| Framework | Spring Boot | 3.3.x | Industry standard, mature ecosystem |
| ORM | Spring Data JPA + Hibernate | 6.x | Clean repository pattern, schema migration support |
| DB Migration | Flyway | 10.x | Version-controlled schema migrations |
| Security | Spring Security | 6.x | JWT filter chain, method-level security |
| JWT | jjwt (JJWT library) | 0.12.x | Clean JWT creation and validation |
| Password Hashing | BCrypt (Spring Security) | built-in | Industry standard, cost factor 12 |
| Caching / Rate Limiting | Redis via Spring Data Redis | 3.x | Token store, rate limit counters |
| Build Tool | Maven | 3.9.x | Dependency management, lifecycle |

### 5.2 Database

| Technology | Role |
|---|---|
| PostgreSQL 16 | Primary datastore — users, roles, tokens, audit logs |
| Redis 7 | Token blacklist, rate-limit counters, session metadata cache |

### 5.3 Testing

| Layer | Tool |
|---|---|
| Unit Tests | JUnit 5 + Mockito |
| Integration Tests | Spring Boot Test + Testcontainers (real PostgreSQL + Redis) |
| E2E / API Tests | REST-assured |
| Code Coverage | JaCoCo (minimum 80% enforcement) |
| Mutation Testing | PIT (PITest) — optional advanced milestone |

### 5.4 DevOps

| Tool | Purpose |
|---|---|
| Docker | Containerize the application |
| Docker Compose | Local dev: app + PostgreSQL + Redis |
| GitHub Actions | CI pipeline |
| GitHub Container Registry | Store built Docker images |

### 5.5 Developer Tooling

| Tool | Purpose |
|---|---|
| Lombok | Reduce boilerplate (getters, builders, etc.) |
| MapStruct | DTO ↔ Entity mapping |
| SpringDoc OpenAPI | Auto-generate Swagger UI from code |
| Spring Boot Actuator | Health, metrics, info endpoints |

---

## 6. Database Schema

### 6.1 Entity Relationship Overview

```
users
  ├── user_roles (join)
  │     └── roles
  │           └── role_permissions (join)
  │                 └── permissions
  ├── refresh_tokens
  ├── password_history
  ├── password_reset_tokens
  └── audit_logs
```

### 6.2 Table Definitions

#### `users`
```sql
CREATE TABLE users (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(30)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    first_name     VARCHAR(100),
    last_name      VARCHAR(100),
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ,
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED'))
);

CREATE INDEX idx_users_email    ON users (LOWER(email));
CREATE INDEX idx_users_username ON users (LOWER(username));
CREATE INDEX idx_users_status   ON users (status) WHERE deleted_at IS NULL;
```

#### `roles`
```sql
CREATE TABLE roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `permissions`
```sql
CREATE TABLE permissions (
    id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name     VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50)  NOT NULL,
    action   VARCHAR(50)  NOT NULL,
    UNIQUE (resource, action)
);
```

#### `role_permissions` (join)
```sql
CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

#### `user_roles` (join)
```sql
CREATE TABLE user_roles (
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     UUID        NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID        REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);
```

#### `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address  INET,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user_id    ON refresh_tokens (user_id) WHERE revoked = FALSE;
CREATE INDEX idx_rt_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_rt_expires_at ON refresh_tokens (expires_at);
```

#### `password_reset_tokens`
```sql
CREATE TABLE password_reset_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_user_id ON password_reset_tokens (user_id);
```

#### `password_history`
```sql
CREATE TABLE password_history (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ph_user_id ON password_history (user_id, created_at DESC);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata   JSONB,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    archived   BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_al_user_id    ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_al_action     ON audit_logs (action);
CREATE INDEX idx_al_created_at ON audit_logs (created_at DESC);
```

> [!CAUTION]
> `audit_logs` is **append-only**. No `UPDATE` or `DELETE` is ever issued against this table from application code. Enforced at both application and DB level via a PostgreSQL rule if needed.

### 6.3 Redis Key Design

| Key Pattern | TTL | Purpose |
|---|---|---|
| `rate:login:ip:{ip}` | 15 min | Login attempt counter per IP |
| `rate:login:acct:{userId}` | 30 min | Consecutive failed login counter per user |
| `rate:pwreset:{email}` | 1 hour | Password reset request counter |
| `token:blacklist:{jti}` | = token TTL | Blacklisted (logged-out) access tokens |
| `session:cache:{userId}` | 5 min | Cached active session list for user |

---

## 7. API Design

### 7.1 Conventions

- **Base URL:** `/api/v1`
- **Content-Type:** `application/json`
- **Auth Header:** `Authorization: Bearer <access_token>`

**Standard error response:**
```json
{
  "timestamp": "2026-10-15T18:00:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Email is already registered.",
  "path": "/api/v1/auth/register",
  "correlationId": "req-abc123"
}
```

**Paginated response:**
```json
{
  "data": [],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "last": false
}
```

### 7.2 Endpoint Map

```
AUTH
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/logout-all
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password
  POST   /api/v1/auth/change-password
  GET    /api/v1/auth/me

USERS
  GET    /api/v1/users                             [ADMIN]
  GET    /api/v1/users/{id}                        [ADMIN | SELF]
  PATCH  /api/v1/users/{id}                        [ADMIN | SELF]
  DELETE /api/v1/users/{id}                        [ADMIN | SELF]
  PATCH  /api/v1/users/{id}/status                 [ADMIN]
  GET    /api/v1/users/{id}/sessions               [ADMIN | SELF]
  DELETE /api/v1/users/{id}/sessions/{sessionId}   [ADMIN | SELF]
  GET    /api/v1/users/{id}/audit-logs             [ADMIN]

ROLES
  GET    /api/v1/roles                             [ADMIN]
  POST   /api/v1/roles                             [SUPER_ADMIN]
  PATCH  /api/v1/roles/{id}                        [SUPER_ADMIN]
  DELETE /api/v1/roles/{id}                        [SUPER_ADMIN]
  POST   /api/v1/users/{id}/roles                  [ADMIN]
  DELETE /api/v1/users/{id}/roles/{roleId}         [ADMIN]

HEALTH
  GET    /api/v1/health
  GET    /api/v1/health/detailed                   [ADMIN]
```

### 7.3 Key Request / Response Schemas

#### `POST /auth/register`
```json
// Request
{
  "username": "soham_dev",
  "email": "soham@example.com",
  "password": "SecurePass@123",
  "firstName": "Soham",
  "lastName": "Patil"
}
// Response 201
{
  "id": "uuid",
  "username": "soham_dev",
  "email": "soham@example.com",
  "roles": ["USER"],
  "createdAt": "2026-10-15T18:00:00Z"
}
```

#### `POST /auth/login`
```json
// Request
{ "email": "soham@example.com", "password": "SecurePass@123" }
// Response 200
{
  "accessToken":  "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType":    "Bearer",
  "expiresIn":    900
}
```

#### `POST /auth/refresh`
```json
// Request
{ "refreshToken": "eyJ..." }
// Response 200
{
  "accessToken":  "eyJ...",
  "refreshToken": "eyJ...",   // NEW rotated token
  "tokenType":    "Bearer",
  "expiresIn":    900
}
```

---

## 8. UI Design Structure

> AuthCore is API-first. The primary "UI" is the Swagger developer portal.

### 8.1 Swagger UI (Auto-generated)
- **URL:** `http://localhost:8080/swagger-ui.html`
- Grouped by module: Auth · Users · Roles · Health
- Each endpoint documents: request schema, response schema, required auth header, all error codes
- "Try it out" enabled for all endpoints

### 8.2 Admin Dashboard (Phase 2 — Optional)
If a frontend is added later, page structure:

```
/login              → Login (email + password)
/dashboard          → Overview: user count, active sessions, recent events
/users              → Paginated table: search, filter by status/role
/users/{id}         → Detail: profile, roles, sessions, audit log
/roles              → Role list with permission badges
/audit              → Full audit log: filter by action, date, user
```

**Design language:** Minimalist dark — `#0a0a0a` background, muted gold accent, `Inter` typography, `1px` borders, generous whitespace. (Same direction as previous UI discussion.)

---

## 9. Testing Strategy

### 9.1 The Pyramid

```
         ┌─────────┐
         │   E2E   │  REST-assured · full HTTP · real containers
         ├─────────┤
         │ Integr. │  @SpringBootTest · Testcontainers (PG + Redis)
         ├─────────┤
         │  Unit   │  JUnit 5 + Mockito · no Spring context
         └─────────┘
```

### 9.2 Unit Tests — What to Cover

| Target | Examples |
|---|---|
| Password validator | Weak passwords rejected, strong passes |
| JWT service | Token generated → parsed → claims match |
| Rate limit logic | Counter increments, lock triggered at threshold |
| Permission resolution | Union of multi-role permissions computed correctly |
| Soft delete | `deletedAt` set, user not returned in active queries |
| Password history | Re-use of last 5 passwords rejected |

### 9.3 Integration Tests — What to Cover

| Target | Examples |
|---|---|
| User registration | DB row correct after register |
| Duplicate email | 409 Conflict returned, no duplicate row |
| Token rotation | Old token revoked, new token valid |
| Redis rate limiting | Counter key set with correct TTL |
| Audit log written | Row in `audit_logs` after every auth action |
| Flyway migrations | Schema matches expected on clean startup |

### 9.4 E2E Tests — Scenarios

| Scenario | Expected |
|---|---|
| Register → Login → hit protected endpoint | All 200 |
| Wrong password 5× → 6th attempt | 429 Too Many Requests |
| Expired access token → Refresh → Retry | New token accepted |
| Logout → reuse old refresh token | 401 Unauthorized |
| Non-admin hits `/users` | 403 Forbidden |
| Password reset with expired token | 400 Bad Request |
| Suspended user tries to login | 403 with specific message |
| Re-use of last password on change | 400 Bad Request |

### 9.5 Coverage Thresholds (JaCoCo — build fails if not met)

| Module | Min Line Coverage |
|---|---|
| `auth` | 90% |
| `user` | 85% |
| `role` | 85% |
| `token` | 90% |
| `ratelimit` | 80% |
| **Overall** | **80%** |

---

## 10. DevOps & CI/CD

### 10.1 Dockerfile (Multi-stage)

```
Stage 1 — builder
  Base:   maven:3.9-eclipse-temurin-21
  Action: mvn package -DskipTests (tests run in CI separately)
  Output: target/authcore.jar

Stage 2 — runtime
  Base:   eclipse-temurin:21-jre-alpine
  Action: COPY jar from builder, EXPOSE 8080, ENTRYPOINT java -jar
  Size:   ~180MB (alpine JRE only)
```

### 10.2 Docker Compose (Local Dev)

```yaml
Services:
  postgres:
    image: postgres:16-alpine
    healthcheck: pg_isready
    volumes: postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    healthcheck: redis-cli ping

  app:
    build: .
    ports: "8080:8080"
    depends_on: [postgres (healthy), redis (healthy)]
    env_file: .env
```

### 10.3 GitHub Actions Pipeline

```
Trigger: push → main | pull_request → main

Job 1: build-and-test
  ├── Checkout
  ├── Setup JDK 21 (temurin)
  ├── Cache ~/.m2
  ├── mvn verify          ← compiles + unit + integration + e2e + JaCoCo
  ├── Upload coverage report (HTML artifact)
  └── Upload Surefire test results

Job 2: docker-build-push  (only on push to main, after job 1 passes)
  ├── Docker Buildx setup
  ├── Login to ghcr.io
  ├── Build image
  └── Push tags:
        ghcr.io/{owner}/authcore:{git-sha}
        ghcr.io/{owner}/authcore:latest
```

### 10.4 Environment Variables

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL JDBC URL |
| `DB_USERNAME` | DB user |
| `DB_PASSWORD` | DB password |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port |
| `JWT_SECRET` | Signing secret (min 256-bit) |
| `JWT_ACCESS_EXPIRY_SECONDS` | Access token TTL (default: 900) |
| `JWT_REFRESH_EXPIRY_SECONDS` | Refresh token TTL (default: 604800) |
| `APP_BASE_URL` | Used in password reset email links |
| `MAIL_HOST` / `MAIL_PORT` | SMTP config for email |

> [!IMPORTANT]
> Secrets are injected at runtime via `.env` locally and via GitHub Actions Secrets in CI. Never committed to source control.

---

## 11. Project Structure

```
authcore/
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker/
│   └── docker-compose.yml
│
├── src/
│   ├── main/
│   │   ├── java/com/authcore/
│   │   │   ├── AuthCoreApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── RedisConfig.java
│   │   │   │   └── OpenApiConfig.java
│   │   │   ├── auth/
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   ├── service/AuthService.java
│   │   │   │   ├── dto/
│   │   │   │   └── exception/
│   │   │   ├── user/
│   │   │   │   ├── controller/UserController.java
│   │   │   │   ├── service/UserService.java
│   │   │   │   ├── repository/UserRepository.java
│   │   │   │   ├── entity/User.java
│   │   │   │   ├── dto/
│   │   │   │   └── mapper/UserMapper.java
│   │   │   ├── role/
│   │   │   │   ├── controller/RoleController.java
│   │   │   │   ├── service/RoleService.java
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   ├── token/
│   │   │   │   ├── JwtService.java
│   │   │   │   ├── RefreshTokenService.java
│   │   │   │   ├── entity/RefreshToken.java
│   │   │   │   └── repository/RefreshTokenRepository.java
│   │   │   ├── audit/
│   │   │   │   ├── AuditService.java
│   │   │   │   ├── entity/AuditLog.java
│   │   │   │   └── repository/AuditLogRepository.java
│   │   │   ├── ratelimit/
│   │   │   │   └── RateLimitService.java
│   │   │   ├── health/
│   │   │   │   └── HealthController.java
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ApiException.java
│   │   │   └── common/
│   │   │       ├── ApiResponse.java
│   │   │       └── PageResponse.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           ├── V1__init_schema.sql
│   │           ├── V2__seed_roles.sql
│   │           └── V3__seed_permissions.sql
│   │
│   └── test/
│       └── java/com/authcore/
│           ├── unit/
│           │   ├── auth/AuthServiceTest.java
│           │   ├── token/JwtServiceTest.java
│           │   └── user/UserServiceTest.java
│           ├── integration/
│           │   ├── auth/AuthIntegrationTest.java
│           │   ├── user/UserIntegrationTest.java
│           │   └── role/RoleIntegrationTest.java
│           └── e2e/
│               └── AuthFlowE2ETest.java
│
├── Dockerfile
├── pom.xml
└── README.md
```

---

## 12. Milestones

| # | Phase | Deliverables | Done when |
|---|---|---|---|
| M1 | **Foundation** | Maven project, `pom.xml`, Flyway migrations, entities, repos, Docker Compose | App boots, DB connected, schema created |
| M2 | **Auth Core** | Register, Login, JWT, Refresh rotation, Logout | Full auth flow via Swagger |
| M3 | **Security Layer** | Spring Security filter, rate limiting (Redis), account lock, password policy | Protected endpoints enforce JWT; rate limits work |
| M4 | **User & Roles** | All user + role endpoints, RBAC, `@PreAuthorize` | Admin can manage users and roles |
| M5 | **Audit & Reset** | Audit log writes on all actions, password reset email flow, password history check | Audit trail visible; reset flow works end-to-end |
| M6 | **Full Test Suite** | Unit + Integration (Testcontainers) + E2E (REST-assured), JaCoCo gate | `mvn verify` passes with ≥80% coverage |
| M7 | **DevOps** | Multi-stage Dockerfile, GitHub Actions CI (build → test → push image) | Green CI pipeline on every push |

---

> **This document is the single source of truth.**
> All implementation decisions must trace back to a rule or requirement defined here.
> If something is built that isn't covered here, update this document first.
