# AuthCore 🛡️

[![CI](https://github.com/Soham6888/authcore/actions/workflows/ci.yml/badge.svg)](https://github.com/Soham6888/authcore/actions/workflows/ci.yml)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)

A production-grade, standalone **Authentication & User Management API** built to demonstrate engineering excellence across:
- **Database Architecture & Schema Design**: Relational normalization, indexing strategy, token rotation, password history, and immutable append-only audit logging.
- **Testing Pyramid**: Unit testing (JUnit 5 + Mockito), integration testing with real databases/caches, and end-to-end API verification with JaCoCo coverage enforcement (≥ 80%).
- **DevOps & Containerization**: Multi-stage Docker builds, Docker Compose local orchestration, and GitHub Actions CI pipelines.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Runtime** | Java 21 LTS | Modern records, pattern matching, virtual threads |
| **Framework** | Spring Boot 3.3+ | Spring Web, Spring Security, Spring Data JPA, Spring Data Redis |
| **Primary Datastore** | PostgreSQL 16 | Relational tables, foreign keys, indexes, pgcrypto UUIDs |
| **Cache & Rate Limiting** | Redis 7 | In-memory token blacklisting, rate-limit counters with TTL |
| **Migrations** | Flyway | Version-controlled, reproducible SQL database migrations |
| **Security & Tokens** | Spring Security 6 + JJWT | Stateless JWT access tokens + persistent refresh token rotation |
| **Testing** | JUnit 5, Mockito, Testcontainers, REST-assured | Comprehensive test coverage with JaCoCo gates |
| **DevOps** | Docker, Docker Compose, GitHub Actions | Automated build, test, and container verification |

---

## 🗄️ Database Schema & Entities

AuthCore uses 8 relational tables managed via Flyway migrations (`db/migration`):

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

- **`users`**: User identity, status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), soft-delete tracking (`deleted_at`).
- **`roles` & `permissions`**: Granular Role-Based Access Control (`users:read`, `users:write`, `roles:read`, etc.).
- **`refresh_tokens`**: SHA-256 hashed refresh tokens with device fingerprinting and rotation tracking.
- **`password_reset_tokens`**: Single-use, time-limited reset links (15 min TTL).
- **`password_history`**: Enforces zero-reuse of the last 5 passwords.
- **`audit_logs`**: Append-only security audit events with JSONB metadata and IP tracking.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Java 21 LTS** (`java -version`)
- **Docker & Docker Compose** (for PostgreSQL and Redis)

### 1. Clone the repository
```bash
git clone https://github.com/Soham6888/authcore.git
cd authcore
```

### 2. Start PostgreSQL and Redis
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Run the application
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The API will be live at `http://localhost:8080`.

### 4. Health Check
```bash
curl http://localhost:8080/api/v1/health
```

---

## 🧪 Testing & Coverage

Run the full test suite and generate JaCoCo coverage reports:

```bash
# Windows
.\mvnw.cmd clean verify

# Linux / macOS
./mvnw clean verify
```

Coverage reports are generated at `target/site/jacoco/index.html`.

---

## 📦 Containerization

Build the production multi-stage Docker image:
```bash
docker build -t authcore:latest .
```

Run container:
```bash
docker run -p 8080:8080 --env-file .env authcore:latest
```

---

## 📄 License
MIT License.
