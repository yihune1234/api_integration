# EthioBridge API Platform — Secure Document Extraction API

**Version:** 2.0 (Scope Reset)
**Type:** Technical & Product Specification (build-ready)
**Status:** Draft for implementation
**Supersedes:** EthioBridge_Specification.md (Business Data Integration Platform version) and EthioBridge_Modern_Build_Prompt.md

---

## Table of Contents

1. [Overview](#1-overview)
2. [What Changed From the Previous Scope](#2-what-changed-from-the-previous-scope)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Data Boundary — What's Stored vs Never Stored](#5-data-boundary--whats-stored-vs-never-stored)
6. [Database Data Model (Overview)](#6-database-data-model-overview)
7. [System Modules](#7-system-modules)
8. [API Endpoints (MVP)](#8-api-endpoints-mvp)
9. [Request Flow (End-to-End)](#9-request-flow-end-to-end)
10. [Authentication Model](#10-authentication-model)
11. [Rate Limiting](#11-rate-limiting)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Error Handling Standard](#13-error-handling-standard)
14. [Roadmap (Versions)](#14-roadmap-versions)

---

## 1. Overview

EthioBridge API Platform is a backend-only REST API that lets developers and organizations integrate with a secure document extraction service using API keys. It accepts JSON, XML, CSV, and Excel files, extracts their data, converts it into a standardized JSON format, and returns it immediately.

It is an **API product**, not a business integration engine: no field mapping, no validation-rule engine, no data transformation. Extract → standardize → return. That simplicity is the point — it's what makes it sellable as a metered API product with plans and usage limits.

---

## 2. What Changed From the Previous Scope

| Aspect | Previous (Business Integration Platform) | Current (API Platform) |
|---|---|---|
| Purpose | Extract → validate → map → transform business data | Extract → convert → return, nothing more |
| Database | None, or credential-only | **Required** — full platform management DB |
| What persists | Nothing (or just API keys) | Users, API keys, usage, logs, rate limits, admin accounts |
| Accounts | None — static issued keys | Full self-serve: register, login, password reset |
| API key lifecycle | Issued externally, checked against config | Self-serve generate / revoke / regenerate / disable |
| Stack | Node 24, TypeScript, Fastify, Zod | Node.js, Express.js, plain JavaScript |
| Rate limiting | In-memory/Redis TTL, request-scoped | DB-tracked, plan-based (Free/Business/Enterprise) |
| Mapping/Validation/Transformation | Full engine, rules sent per request | **Removed entirely** |

**What stayed the same:** uploaded files and their extracted contents are still never permanently stored. That principle survives the scope reset unchanged — it's just no longer the *only* data-handling rule, since platform/account data now legitimately persists.

---

## 3. Technology Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | JavaScript |
| Database | MySQL or PostgreSQL |
| Admin Auth | JWT |
| File upload | Multer (memory storage — never disk) |
| Excel parsing | SheetJS |
| XML parsing | fast-xml-parser |
| CSV parsing | csv-parser |
| Config | dotenv |

This is a deliberately conventional, widely-supported stack — appropriate for a product that needs a broad hiring pool and a mature middleware ecosystem (auth, rate limiting, logging) more than it needs cutting-edge performance.

---

## 4. System Architecture

```
                    ┌─────────────────────────────┐
                    │      Client Application       │
                    │ (developer / organization)     │
                    └───────────────┬─────────────────┘
                                    │ HTTPS
                                    │ Authorization: Bearer <API_KEY>  (extraction)
                                    │ JWT (admin/user account actions)
                                    ▼
                    ┌─────────────────────────────┐
                    │        Express.js App          │
                    │   (routes, middleware chain)    │
                    └───────────────┬─────────────────┘
                                    ▼
        ┌──────────────────────────┴──────────────────────────┐
        ▼                                                       ▼
┌───────────────────┐                                 ┌───────────────────┐
│  Account/Admin      │                                 │  Extraction Path    │
│  Path (JWT auth)     │                                 │  (API Key auth)      │
│                       │                                 │                       │
│  Auth Module          │                                 │  API Key Validation    │
│  API Key Mgmt Module   │                                 │  Rate Limit Check       │
│  Usage Mgmt Module      │                                 │  Upload (Multer, memory) │
│  Admin Module            │                                 │  Detect File Type         │
└──────────┬────────────┘                                 │  Extract Data               │
           │                                                │  Convert to Standard JSON    │
           ▼                                                │  Return Response              │
   ┌───────────────┐                                        │  Delete File from Memory       │
   │   Database      │◄──────────── usage log write ─────────│  Save Usage Log Only            │
   │ (MySQL/Postgres) │                                        └───────────────┘
   │ - Users            │
   │ - API Keys           │
   │ - API Usage            │
   │ - Activity Logs          │
   │ - Rate Limits              │
   │ - Admin Info                  │
   └───────────────────────────────┘
```

Two distinct paths through the same Express app:
- **Account/Admin path** — JWT-authenticated, talks to the database for account and platform management.
- **Extraction path** — API-key-authenticated, processes files in memory, and only ever writes a usage-log row to the database (never the file or its contents).

---

## 5. Data Boundary — What's Stored vs Never Stored

### Stored (platform management only)

**Users** — organization name, contact email, hashed password, status, created date
**API Keys** — key, user ID, status, plan, expiration date, created date
**API Usage** — user ID, API key, request count, date, processing time, response status
**Activity Logs** — user, action, timestamp, IP address, endpoint accessed
**Rate Limits** — max requests, remaining requests, reset date
**Admin Information** — administrator accounts, roles, permissions

### Never stored

- Uploaded files
- Extracted JSON output
- XML/CSV/Excel file contents
- Any parsed document data

**Rule of thumb:** if it's *about* the request (who, when, how long, what status), it's stored. If it *is* the request's content (the file, its data), it's discarded the instant the response is sent.

---

## 6. Database Data Model (Overview)

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID / INT PK | |
| organization_name | VARCHAR | |
| contact_email | VARCHAR, unique | |
| password_hash | VARCHAR | bcrypt/argon2 |
| status | ENUM(active, disabled, pending) | |
| created_at | TIMESTAMP | |

### api_keys
| Column | Type | Notes |
|---|---|---|
| id | UUID / INT PK | |
| user_id | FK → users.id | |
| api_key | VARCHAR, unique, hashed at rest | |
| status | ENUM(active, revoked, expired) | |
| plan | ENUM(free, business, enterprise) | |
| expires_at | TIMESTAMP, nullable | |
| created_at | TIMESTAMP | |

### api_usage
| Column | Type | Notes |
|---|---|---|
| id | UUID / INT PK | |
| user_id | FK → users.id | |
| api_key_id | FK → api_keys.id | |
| request_count | INT | |
| date | DATE | aggregated per day |
| processing_time_ms | INT | |
| response_status | INT | HTTP status of the extraction call |

### activity_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID / INT PK | |
| user_id | FK → users.id, nullable | null for unauthenticated attempts |
| action | VARCHAR | e.g. "key.revoked", "extract.success" |
| timestamp | TIMESTAMP | |
| ip_address | VARCHAR | |
| endpoint | VARCHAR | |

### rate_limits
| Column | Type | Notes |
|---|---|---|
| id | UUID / INT PK | |
| api_key_id | FK → api_keys.id | |
| max_requests | INT | derived from plan |
| remaining_requests | INT | decremented per request |
| reset_at | TIMESTAMP | when the window resets |

### admins
| Column | Type | Notes |
|---|---|---|
| id | UUID / INT PK | |
| email | VARCHAR, unique | |
| password_hash | VARCHAR | |
| role | ENUM(super_admin, support, read_only) | |
| permissions | JSON | fine-grained overrides if needed |

Full DDL and the corresponding folder structure are in the companion document: `EthioBridge_API_DB_Schema_and_Folder_Structure.md`.

---

## 7. System Modules

| Module | Responsibility |
|---|---|
| **Authentication** | Organization register/login/change-password/reset-password, JWT issuance for admins |
| **API Key Management** | Generate, revoke, regenerate, view, disable API keys |
| **Document Extraction** | Detect format, extract data, convert to standard JSON, return response |
| **API Usage Management** | Track total/daily/monthly, failed/successful requests |
| **Rate Limiting** | Enforce per-plan limits, track remaining requests and reset windows |
| **Logging** | Store request metadata only (never document content) |
| **Admin Dashboard** *(future)* | Manage users, keys, usage, logs, plans |
| **User Dashboard** *(future)* | Self-serve key management, usage viewing, plan upgrades, API docs/playground |

---

## 8. API Endpoints (MVP)

### Authentication
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register an organization |
| POST | `/auth/login` | Login, receive JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/change-password` | Change password (authenticated) |
| POST | `/auth/reset-password` | Reset password flow |

### API Key
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api-keys` | Create a new API key |
| GET | `/api-keys` | List the organization's API keys |
| POST | `/api-keys/:id/revoke` | Revoke a key |
| POST | `/api-keys/:id/regenerate` | Regenerate a key |

### Extraction
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/v1/extract` | Upload a document, receive standardized JSON |

### User
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/user/profile` | Organization profile |
| GET | `/user/usage` | Usage statistics |

### Admin
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/users` | List/manage users |
| GET | `/admin/api-keys` | List/manage API keys |
| GET | `/admin/logs` | View activity logs |
| GET | `/admin/plans` | Manage plans |
| GET | `/admin/dashboard` | Aggregate statistics |

---

## 9. Request Flow (End-to-End)

**Extraction path:**
```
1. Client sends request with API Key + file
2. Authenticate API Key
3. Validate API Key status/expiration
4. Check rate limit (remaining requests for this key)
5. Receive file into memory (Multer memoryStorage)
6. Detect file type (JSON | XML | CSV | XLS | XLSX)
7. Extract data using the matching parser
8. Convert to standard JSON
9. Return JSON response to client
10. Delete file from memory
11. Save usage log (metadata only) — request count, processing time, response status
```

**Account path (register/login/key management):**
```
1. Client sends request with credentials or JWT
2. Authenticate (password check on login, JWT verify otherwise)
3. Perform the requested action (register, generate key, revoke key, etc.)
4. Write an activity_logs entry
5. Return response
```

---

## 10. Authentication Model

Two separate authentication mechanisms, for two separate audiences:

- **JWT** — for organizations/admins managing their account, keys, and viewing usage/dashboards. Standard access + refresh token pattern.
- **API Key (Bearer)** — for the actual document-extraction calls made by client systems integrating programmatically. Checked against `api_keys` on every `/v1/extract` call; validity, status, and expiration all checked before processing.

Passwords are hashed (bcrypt/argon2) — never stored in plaintext. API keys are hashed at rest in the database; only the organization sees the raw key once, at creation/regeneration time.

---

## 11. Rate Limiting

| Plan | Limit |
|---|---|
| Free | 100 requests/day |
| Business | 10,000 requests/day |
| Enterprise | Unlimited or negotiated |

Enforced by checking and decrementing `rate_limits.remaining_requests` on each extraction call, reset at `reset_at`. When exceeded, the request is rejected before any file processing occurs (cheapest possible rejection point).

---

## 12. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Fast extraction response; efficient in-memory file handling |
| Security | HTTPS, hashed passwords, hashed API keys at rest, JWT expiration, input/file validation |
| Reliability | Consistent response envelopes, graceful error handling |
| Scalability | Stateless extraction path (files never touch disk); database scales independently |
| Maintainability | Clear module boundaries between account/admin concerns and extraction concerns |
| Privacy | No document content ever persisted, enforced at the code level, not just policy |

---

## 13. Error Handling Standard

```json
{
  "status": "error",
  "errorCode": "INVALID_API_KEY",
  "message": "The provided API key is invalid or expired.",
  "timestamp": "2026-08-11T09:14:00Z"
}
```

| Error Code | HTTP Status | Trigger |
|---|---|---|
| `MISSING_API_KEY` | 401 | No API key provided on `/v1/extract` |
| `INVALID_API_KEY` | 401 | Key not found, revoked, or expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Plan's daily request limit reached |
| `UNSUPPORTED_FORMAT` | 415 | File type not JSON/XML/CSV/XLS/XLSX |
| `FILE_TOO_LARGE` | 413 | Exceeds configured size limit |
| `EMPTY_FILE` | 400 | No extractable content |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT on an account/admin route |
| `VALIDATION_ERROR` | 422 | Malformed register/login/key-management request body |
| `INTERNAL_ERROR` | 500 | Unhandled processing failure |

---

## 14. Roadmap (Versions)

**Version 1 (Current / MVP)**
Backend REST API only. API Key authentication, JSON/XML/CSV/Excel extraction, usage logging, rate limiting, admin APIs. No frontend.

**Version 2**
React Admin Dashboard, User Portal, API Documentation, API Playground, Plan Management UI.

**Version 3**
Team management, billing integration, webhooks, SDKs, additional document formats (PDF, DOCX), analytics dashboard.