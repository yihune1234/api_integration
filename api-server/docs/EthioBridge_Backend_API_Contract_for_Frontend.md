# EthioBridge — Backend API Contract for Frontend

**Version:** 1.0 (verified against running backend, 2026-08-13)
**Source of truth:** Actual backend behavior confirmed with live HTTP requests against `http://127.0.0.1:5000/api`.

---

## 1. Base URL, Auth, and Envelope

- **Base URL:** `http://127.0.0.1:5000/api` (dev). All paths below are relative to this.
- **Auth headers:**
  - User/auth/admin account routes: `Authorization: Bearer <accessToken>` (JWT).
  - Extraction/API routes: `Authorization: Bearer <apiKey>`.
- **Success envelope (most routes):** varies by route (see below). Most account routes return a plain object; user/admin list routes wrap arrays in a named key (`{ users, limit, offset }`, `{ apiKeys }`, `{ logs, limit, offset }`, `{ plans }`).
- **Error envelope (all routes, from `error-handler.js`):**
  ```json
  {
    "status": "error",
    "errorCode": "INVALID_API_KEY",
    "message": "The provided API key is invalid or revoked.",
    "timestamp": "2026-08-13T06:24:45.804Z"
  }
  ```
  **Confirmed:** VALIDATION_ERROR does **NOT** include a `fields` object — it is a single `message` string only.

---

## 2. Authentication Endpoints

### POST /auth/register
- Body: `{ organizationName, contactEmail, password }`
- Password: min 8 chars. Email must be valid format. All three required.
- **201** response:
  ```json
  {
    "user": { "id": "<uuid>", "organizationName": "...", "contactEmail": "...", "status": "active" },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "tokenType": "Bearer"
  }
  ```
- Errors: 422 `VALIDATION_ERROR` (missing/invalid field, duplicate email).

### POST /auth/login
- Body: `{ contactEmail, password }`
- **200** response: identical shape to register response (`user` + `accessToken` + `refreshToken` + `tokenType`).
- Errors: 401 `UNAUTHORIZED` `"Invalid email or password."` (only triggered when password < 8 chars passes; otherwise 422). Note: a wrong password or unknown email returns 401 with `UNAUTHORIZED`.

### POST /auth/refresh
- Body: `{ refreshToken }`
- **Refresh token delivery (confirmed):** JSON **response body**, NOT an httpOnly cookie. No `Set-Cookie` header is ever set by the backend.
- **200** response: `{ accessToken, refreshToken, tokenType: "Bearer" }`
- Errors: 401 `UNAUTHORIZED` `"Refresh token is invalid or expired."`

### POST /auth/change-password (requires user JWT)
- Body: `{ currentPassword, newPassword }` (both min 8 chars).
- **200** response: `{ "message": "Password changed successfully." }`
- Errors: 401 `UNAUTHORIZED` (current password wrong / no token).

### POST /auth/reset-password (request — endpoint 1 of 2)
- Body: `{ contactEmail }`
- **Password reset = two endpoints** (request + confirm), confirmed.
- **200** response when user exists:
  ```json
  { "message": "If an account exists for that email, reset instructions have been issued.", "resetToken": "<jwt>", "developmentOnly": true }
  ```
  (The reset token is a JWT, returned in the body only in development.)
- **200** response when no user: `{ "message": "If an account exists for that email, reset instructions have been issued." }` (no token).

### POST /auth/reset-password/confirm (confirm — endpoint 2 of 2)
- Body: `{ resetToken, newPassword }`
- **200** response: `{ "message": "Password reset successfully." }`
- Errors: 401 `UNAUTHORIZED` `"Reset token is invalid or expired."`

---

## 3. API Key Endpoints (all require user JWT)

### POST /api-keys
- Body: `{ plan: "free" | "business" | "enterprise" }` — plan is chosen **at API key creation time** (confirmed). Defaults to `"free"`.
- **201** response:
  ```json
  {
    "key": "eb_live_<base64url>",
    "apiKey": { "id": "<uuid>", "keyPrefix": "eb_live_xxxx", "status": "active", "plan": "free", "expiresAt": null, "createdAt": "<iso>" },
    "warning": "Copy this key now. It will not be shown again."
  }
  ```
- The raw `key` is shown only once. `apiKey` is the persisted metadata.

### GET /api-keys
- **200** response: `{ "apiKeys": [ { "id", "keyPrefix", "status", "plan", "expiresAt", "createdAt" } ] }`

### POST /api-keys/:id/revoke
- **200** response: `{ "apiKey": { "id", "keyPrefix", "status": "revoked", "plan", "expiresAt", "createdAt" } }`
- Errors: 404 `NOT_FOUND` if not found/already revoked.

### POST /api-keys/:id/regenerate
- **201** response: same shape as create (`key` + `apiKey`). The old key is revoked first.

---

## 4. User Endpoints (require user JWT)

### GET /user/profile
- **200** response:
  ```json
  { "status": "success", "user": { "id": "<uuid>", "organizationName": "...", "contactEmail": "...", "status": "active", "createdAt": "<iso>" } }
  ```

### GET /user/usage
- **200** response — **confirmed `daily` and `monthly` are NUMBERS (counts), NOT arrays**:
  ```json
  { "status": "success", "usage": { "total": 0, "daily": 0, "monthly": 0, "failed": 0, "successful": 0 } }
  ```

---

## 5. Extraction

### POST /v1/extract (requires API key)
- Multipart form-data, field name `file`. Max size **10 MB**. Allowed: `.json`, `.xml`, `.csv`, `.xls`, `.xlsx`.
- Middleware order: `requireApiKey` → `rateLimit` → `multer` → handler.
- **Rate-limit headers:** **confirmed NOT returned** (no `X-RateLimit-Remaining` / `X-RateLimit-Reset`). Only the 429 error body indicates a limit.
- **200 success response (confirmed shape — flat, NO `data`/`metadata` wrapper, NO `fileType`, field is `format`):**
  ```json
  {
    "status": "success",
    "format": "csv",
    "records": [ { "name": "Alice", "age": "30" }, { "name": "Bob", "age": "25" } ],
    "recordCount": 2
  }
  ```

### Errors (from `/v1/extract` and key-check)
| errorCode | HTTP | Trigger |
|---|---|---|
| `MISSING_API_KEY` | 401 | No Bearer key |
| `INVALID_API_KEY` | 401 | Key not found / revoked / expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Plan daily limit reached |
| `UNSUPPORTED_FORMAT` | 415 | Bad/mismatched format |
| `FILE_TOO_LARGE` | 413 | > 10 MB |
| `EMPTY_FILE` | 400 | Empty/no content |
| `INTERNAL_ERROR` | 500 | Unhandled |

---

## 6. Admin Endpoints (require admin JWT; role-checked)

### POST /admin/login (public)
- Body: `{ email, password }`
- **200** response:
  ```json
  { "accessToken": "<jwt>", "tokenType": "Bearer", "admin": { "id": "<uuid>", "email": "...", "role": "super_admin" } }
  ```
- Admin tokens carry a `role` claim; user tokens do not. Roles: `super_admin` > `support` > `read_only`.

### GET /admin/users (super_admin, support, read_only)
- **200** response:
  ```json
  { "users": [ { "id", "organization_name", "contact_email", "status", "created_at" } ], "limit": 100, "offset": 0 }
  ```
- **snake_case field names. No user status-update endpoint exists** — only read + revoke key.

### GET /admin/api-keys (super_admin, support, read_only)
- **200** response: `{ "apiKeys": [ { "id", "user_id", "key_prefix", "status", "plan", "expires_at", "created_at", "user_organization", "user_email" } ], "limit", "offset" }` (snake_case)

### POST /admin/api-keys/:id/revoke (super_admin, support)
- **200** response: `{ "message": "API key revoked successfully." }`
- Errors: 404 `NOT_FOUND`.

### GET /admin/logs (super_admin, support, read_only)
- Query params (confirmed): `limit` (default 100, max 1000), `offset` (default 0), `userId`, `action`, `fromDate`, `toDate`.
- **200** response:
  ```json
  { "logs": [ { "id", "user_id", "action", "ip_address", "endpoint", "timestamp", "user_organization", "user_email" } ], "limit", "offset" }
  ```
- (snake_case)

### GET /admin/plans (super_admin, support, read_only)
- **200** response — **confirmed `name` (not `plan`) and `max_requests` (not `maxRequestsPerDay`):**
  ```json
  { "plans": [ { "id": "<uuid>", "name": "free", "max_requests": 100 } ] }
  ```

### PUT /admin/plans/:id (super_admin only)
- Body: `{ maxRequests: <int> }`
- **200** response: `{ "plans": [...], "message": "Plan limits updated." }`
- Errors: 422 `VALIDATION_ERROR` if not a positive integer.

### GET /admin/dashboard (super_admin, support, read_only)
- **200** response (confirmed shape):
  ```json
  { "status": "success", "stats": { "users": { "total": 32, "active": 32 }, "apiKeys": { "total": 38, "active": 22 }, "requests": { "total": 36, "today": 1, "failed": 29 } } }
  ```

---

## 7. Other

### GET /healthz
- **200**: `{ "status": "ok" }`

### GET /v1/key-check (requires API key)
- **200**: `{ "status": "ok", "plan": "free" }`

---

## 8. Confirmed Contract Answers (Section 10 resolution)

| Question | Confirmed Answer |
|---|---|
| Refresh token delivery | JSON **response body** — NOT an httpOnly cookie (no `Set-Cookie` anywhere) |
| VALIDATION_ERROR per-field detail | Single `message` only — no `fields` object |
| /v1/extract success fields | `status`, `format`, `records`, `recordCount` — flat; NO `data`/`metadata` wrapper; field is `format` not `fileType`; no `processingTimeMs` |
| GET /user/usage `daily`/`monthly` | **Numbers** (counts), NOT arrays |
| GET /admin/logs query params | `limit`, `offset`, `userId`, `action`, `fromDate`, `toDate`; response `{ logs, limit, offset }` |
| Password reset | **Two endpoints** (request + confirm); reset token is a JWT, returned in body (`developmentOnly`) |
| Rate-limit headers on /v1/extract | **NOT returned** — only the 429 error body |
| Plan selection | Chosen **at API key creation time** (`POST /api-keys` body `plan`), not account-level |