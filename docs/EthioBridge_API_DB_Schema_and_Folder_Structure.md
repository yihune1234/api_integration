# EthioBridge API Platform — Database Schema & Folder Structure

**Companion to:** EthioBridge_API_Platform_Specification.md
**Stack:** Node.js, Express.js, JavaScript, MySQL or PostgreSQL

---

## 1. Database Schema (DDL)

Written in PostgreSQL syntax; notes call out the MySQL equivalent where it differs.

```sql
-- ========================================
-- users
-- ========================================
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- MySQL: CHAR(36) + app-generated UUID
  organization_name VARCHAR(255) NOT NULL,
  contact_email     VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'active',       -- active | disabled | pending
  created_at        TIMESTAMP NOT NULL DEFAULT now()
);

-- ========================================
-- api_keys
-- ========================================
CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash     VARCHAR(255) NOT NULL UNIQUE,   -- store a hash, never the raw key
  key_prefix   VARCHAR(12) NOT NULL,           -- short, non-secret prefix shown in UI (e.g. "eb_live_9f2a")
  status       VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | revoked | expired
  plan         VARCHAR(20) NOT NULL DEFAULT 'free',    -- free | business | enterprise
  expires_at   TIMESTAMP NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- ========================================
-- api_usage  (one row per key per day; incremented per request)
-- ========================================
CREATE TABLE api_usage (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id         UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  request_count      INT NOT NULL DEFAULT 0,
  date               DATE NOT NULL,
  processing_time_ms INT,             -- rolling/last value, or move to a separate per-request table if needed
  response_status    INT,
  UNIQUE (api_key_id, date)
);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);

-- ========================================
-- activity_logs
-- ========================================
CREATE TABLE activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NULL REFERENCES users(id) ON DELETE SET NULL,  -- null = unauthenticated attempt
  action     VARCHAR(100) NOT NULL,       -- e.g. "key.revoked", "extract.success", "auth.login"
  timestamp  TIMESTAMP NOT NULL DEFAULT now(),
  ip_address VARCHAR(45),                 -- IPv6-safe length
  endpoint   VARCHAR(255)
);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- ========================================
-- rate_limits  (current window state per key)
-- ========================================
CREATE TABLE rate_limits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id          UUID NOT NULL UNIQUE REFERENCES api_keys(id) ON DELETE CASCADE,
  max_requests        INT NOT NULL,        -- derived from plan at issuance/upgrade time
  remaining_requests  INT NOT NULL,
  reset_at            TIMESTAMP NOT NULL
);

-- ========================================
-- admins
-- ========================================
CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'support',  -- super_admin | support | read_only
  permissions   JSONB,                                    -- MySQL: JSON
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);
```

**Design notes:**
- `api_keys.key_hash` — the raw key is shown to the user exactly once (on create/regenerate) and never stored; only a hash (e.g. SHA-256 or bcrypt) is kept, matching the "hashed at rest" requirement in the spec.
- `api_usage` is modeled as one row per key per day for simple daily/monthly rollups; if per-request granularity is needed later (e.g. for detailed analytics in V3), add a separate `api_requests` table and keep `api_usage` as the daily aggregate.
- `rate_limits` holds only the *current* window; `reset_at` determines when `remaining_requests` resets to `max_requests`. A scheduled job or lazy check-on-request handles the reset.
- Every foreign key uses `ON DELETE CASCADE` (usage/keys/logs disappear if the user is deleted) except `activity_logs.user_id`, which uses `SET NULL` so historical logs survive account deletion for audit purposes.

---

## 2. Folder Structure

```
ethiobridge-api-platform/
│
├── src/
│   ├── app.js                        # Express app setup, middleware registration
│   ├── server.js                     # Entry point — starts the HTTP server
│   │
│   ├── routes/
│   │   ├── auth.routes.js            # /auth/*
│   │   ├── apiKeys.routes.js         # /api-keys/*
│   │   ├── extract.routes.js         # /v1/extract
│   │   ├── user.routes.js            # /user/*
│   │   └── admin.routes.js           # /admin/*
│   │
│   ├── modules/
│   │   ├── auth/                     # Authentication Module
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js       # register, login, password reset/change
│   │   │   ├── jwt.service.js        # sign/verify access + refresh tokens
│   │   │   └── auth.middleware.js    # requireJwt middleware for protected routes
│   │   │
│   │   ├── apiKeys/                  # API Key Management Module
│   │   │   ├── apiKeys.controller.js
│   │   │   ├── apiKeys.service.js    # generate, revoke, regenerate, disable
│   │   │   └── apiKey.middleware.js  # requireApiKey middleware for /v1/extract
│   │   │
│   │   ├── extraction/               # Document Extraction Module
│   │   │   ├── extraction.controller.js
│   │   │   ├── detection/
│   │   │   │   └── fileTypeDetector.js
│   │   │   └── parsers/
│   │   │       ├── parserFactory.js
│   │   │       ├── jsonParser.js
│   │   │       ├── xmlParser.js      # fast-xml-parser
│   │   │       ├── csvParser.js      # csv-parser
│   │   │       └── excelParser.js    # SheetJS
│   │   │
│   │   ├── usage/                    # API Usage Management Module
│   │   │   ├── usage.controller.js
│   │   │   └── usage.service.js      # record + query request counts, stats
│   │   │
│   │   ├── rateLimit/                # Rate Limiting Module
│   │   │   ├── rateLimit.service.js  # check + decrement remaining_requests
│   │   │   └── rateLimit.middleware.js
│   │   │
│   │   ├── logging/                  # Logging Module
│   │   │   └── activityLogger.js     # writes activity_logs rows (metadata only)
│   │   │
│   │   └── admin/                    # Admin Module
│   │       ├── admin.controller.js
│   │       └── admin.service.js      # user/key/log/plan management
│   │
│   ├── db/
│   │   ├── connection.js             # DB pool/client setup
│   │   ├── migrations/               # SQL migration files (schema in Section 1)
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_api_keys.sql
│   │   │   ├── 003_create_api_usage.sql
│   │   │   ├── 004_create_activity_logs.sql
│   │   │   ├── 005_create_rate_limits.sql
│   │   │   └── 006_create_admins.sql
│   │   └── models/                   # query layer per table
│   │       ├── user.model.js
│   │       ├── apiKey.model.js
│   │       ├── apiUsage.model.js
│   │       ├── activityLog.model.js
│   │       ├── rateLimit.model.js
│   │       └── admin.model.js
│   │
│   ├── middleware/
│   │   ├── errorHandler.js           # centralized error handling (Section 13 of spec)
│   │   ├── multerConfig.js           # Multer memoryStorage setup
│   │   └── requestLogger.js          # attaches request-scoped logging context
│   │
│   ├── errors/
│   │   └── errorTypes.js             # named error classes matching error codes
│   │
│   └── config/
│       ├── env.js                    # loads/validates dotenv variables
│       └── plans.js                  # plan → rate limit mapping (free/business/enterprise)
│
├── tests/
│   ├── auth.test.js
│   ├── apiKeys.test.js
│   ├── extraction.test.js
│   ├── rateLimit.test.js
│   └── usage.test.js
│
├── docs/
│   ├── EthioBridge_API_Platform_Specification.md
│   └── EthioBridge_API_DB_Schema_and_Folder_Structure.md
│
├── .env.example
├── package.json
└── README.md
```

---

## 3. Module-to-Table Ownership

| Module | Owns (reads/writes) |
|---|---|
| Authentication | `users` |
| API Key Management | `api_keys` |
| Document Extraction | *(no table — memory only)*, triggers a write via Usage + Logging |
| API Usage Management | `api_usage` |
| Rate Limiting | `rate_limits` |
| Logging | `activity_logs` |
| Admin | reads across all tables; writes to `admins` |

Keeping this 1:1 (mostly) mapping between module and table means each `*.model.js` file is the only place that runs queries against its table — the Extraction module never touches the database directly, it only calls into Usage and Logging after a request completes.