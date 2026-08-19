# EthioBridge API Platform

A secure document extraction API platform that accepts JSON, XML, CSV, and Excel files, extracts their data, converts it into a standardized JSON format, and returns it immediately. Built as a metered API product with self-serve account management, API keys, usage tracking, and plan-based rate limiting.

##Architecture

```
api_integration/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS
└── api-server/        # Node.js + Express + MySQL
```

### Frontend (EthioBridge Frontend)
- **Framework**: React 19 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation

### Backend (EthioBridge API Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ESM)
- **Database**: MySQL
- **Authentication**: JWT (account/admin) + API Keys (extraction)
- **File Processing**: Multer (memory storage), SheetJS, fast-xml-parser, csv-parser
- **Logging**: Pino

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../api-server
npm install
```

### 2. Configure Environment Variables

**Backend** (`api-server/.env`):
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=ethiobridge

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Run Database Migrations

```bash
cd api-server
npm run migrate
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd api-server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

## 📦 Available Scripts

### Frontend (`frontend/`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run serve` | Preview production build locally |
| `npm run typecheck` | Run TypeScript type checking |

### Backend (`api-server/`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with file watching |
| `npm run start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run typecheck` | Run syntax check on all JS files |

## Authentication

Two separate authentication mechanisms:

1. **JWT (Account/Admin)** - For organizations managing accounts, API keys, and viewing dashboards
2. **API Key (Bearer)** - For programmatic document extraction calls

### API Key Plans
| Plan | Daily Limit |
|------|-------------|
| Free | 100 requests/day |
| Business | 10,000 requests/day |
| Enterprise | Unlimited/Negotiated |

## API Endpoints (MVP)

### Authentication
- `POST /auth/register` - Register organization
- `POST /auth/login` - Login, receive JWT
- `POST /auth/refresh` - Refresh access token
- `POST /auth/change-password` - Change password
- `POST /auth/reset-password` - Reset password flow

### API Key Management
- `POST /api-keys` - Create new API key
- `GET /api-keys` - List organization's API keys
- `POST /api-keys/:id/revoke` - Revoke a key
- `POST /api-keys/:id/regenerate` - Regenerate a key

### Document Extraction
- `POST /v1/extract` - Upload document, receive standardized JSON

### User
- `GET /user/profile` - Organization profile
- `GET /user/usage` - Usage statistics

### Admin
- `GET /admin/users` - List/manage users
- `GET /admin/api-keys` - List/manage API keys
- `GET /admin/logs` - View activity logs
- `GET /admin/plans` - Manage plans
- `GET /admin/dashboard` - Aggregate statistics

## Database Schema

Key tables:
- `users` - Organizations (name, email, password_hash, status)
- `api_keys` - API keys (hashed at rest, plan, status, expiration)
- `api_usage` - Daily aggregated usage metrics
- `activity_logs` - Audit trail (action, timestamp, IP, endpoint)
- `rate_limits` - Plan-based rate limiting counters
- `admins` - Platform administrators

## 🛡️ Security & Privacy

- **Passwords**: Hashed with bcrypt/argon2
- **API Keys**: Hashed at rest in database; raw key shown only once at creation
- **Files**: Never written to disk (Multer memoryStorage); deleted immediately after extraction
- **Extracted Data**: Never persisted - returned in response only
- **HTTPS**: Required in production
- **Input Validation**: File type and size validation on all uploads

## Project Structure

### Frontend
```
frontend/
├── src/
│   ├── components/ui/      # Radix UI wrapper components
│   ├── pages/              # Page components
│   │   ├── marketing/      # Public marketing pages
│   │   ├── docs/           # API documentation pages
│   │   └── *.tsx           # Auth, dashboard, admin pages
│   ├── lib/
│   │   └── api/            # API client and endpoint modules
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global and component styles
│   ├── App.tsx             # Main app with routing
│   └── main.tsx            # Entry point
└── index.html
```

### Backend
```
api-server/
├── src/
│   ├── config/             # Environment & plan configuration
│   ├── db/
│   │   ├── connection.js   # Database connection pool
│   │   ├── migrate.js      # Migration runner
│   │   └── models/         # Data models (users, keys, usage, etc.)
│   ├── middleware/         # Express middleware (auth, error handling, multer)
│   ├── modules/
│   │   ├── api-keys/       # API key CRUD
│   │   ├── auth/           # Authentication (JWT, passwords)
│   │   ├── extraction/     # Document extraction pipeline
│   │   ├── logging/        # Activity logging
│   │   └── premium/        # Payment/plans (future)
│   ├── app.js              # Express app setup
│   └── index.js            # Entry point
└── docs/                   # Technical specifications
```

## 🧪 Testing

```bash
# Frontend type checking
cd frontend && npm run typecheck

# Backend syntax checking
cd api-server && npm run typecheck
```

## 🚀 Production Build

### Frontend
```bash
cd frontend
npm run build
# Output in dist/ - serve with any static file server
```

### Backend
```bash
cd api-server
npm run start
# Ensure NODE_ENV=production and all env vars are set
```

## API Integration Guide

### Getting an API Key

1. **Register an organization** (if not already registered):
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"organizationName": "My Company", "email": "dev@mycompany.com", "password": "securepass123"}'
   ```

2. **Login to get JWT**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "dev@mycompany.com", "password": "securepass123"}'
   ```
   Save the `accessToken` from the response.

3. **Create an API Key** (using JWT):
   ```bash
   curl -X POST http://localhost:3000/api-keys \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_ACCESS_TOKEN" \
     -d '{"plan": "free"}'
   ```
   **Save the `apiKey` immediately** — it's only shown once!

---

### Using the Extraction API

**Endpoint**: `POST /v1/extract`  
**Auth**: `Authorization: Bearer YOUR_API_KEY`  
**Content-Type**: `multipart/form-data` (file upload)  
**Max file size**: 10MB (configurable via `MAX_FILE_SIZE`)

#### Supported Formats
| Format | Extensions | MIME Types |
|--------|------------|------------|
| JSON | `.json` | `application/json` |
| XML | `.xml` | `application/xml`, `text/xml` |
| CSV | `.csv` | `text/csv` |
| Excel | `.xls`, `.xlsx` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

---

### Integration Examples

#### cURL
```bash
# Extract JSON file
curl -X POST http://localhost:3000/v1/extract \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@data.json"

# Extract CSV file
curl -X POST http://localhost:3000/v1/extract \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@data.csv"

# Extract Excel file
curl -X POST http://localhost:3000/v1/extract \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@data.xlsx"
```

#### Python (requests)
```python
import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "http://localhost:3000"

def extract_document(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        headers = {'Authorization': f'Bearer {API_KEY}'}
        response = requests.post(f'{BASE_URL}/v1/extract', files=files, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error {response.status_code}: {response.text}")

# Usage
result = extract_document("data.json")
print(result)
```

#### Node.js (fetch)
```javascript
const fs = require('fs');
const FormData = require('form-data');

const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'http://localhost:3000';

async function extractDocument(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await fetch(`${BASE_URL}/v1/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      ...form.getHeaders()
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

// Usage
extractDocument('data.json')
  .then(console.log)
  .catch(console.error);
```

#### JavaScript/TypeScript (Frontend)
```typescript
async function extractFile(file: File, apiKey: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/v1/extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Extraction failed');
  }
  return response.json();
}

// Usage with file input
const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    try {
      const result = await extractFile(file, 'YOUR_API_KEY');
      console.log('Extracted data:', result);
    } catch (err) {
      console.error(err);
    }
  }
});
```

---

### Response Format

**Success (200)**:
```json
{
  "status": "success",
  "data": {
    "format": "json",
    "recordCount": 150,
    "extractedAt": "2026-08-17T10:30:00.000Z",
    "records": [
      { "id": 1, "name": "Item 1", "value": 100 },
      { "id": 2, "name": "Item 2", "value": 200 }
    ]
  }
}
```

**Error Responses**:
| Status | Error Code | Description |
|--------|------------|-------------|
| 401 | `MISSING_API_KEY` | No API key provided |
| 401 | `INVALID_API_KEY` | Key invalid, revoked, or expired |
| 429 | `RATE_LIMIT_EXCEEDED` | Daily limit reached |
| 415 | `UNSUPPORTED_FORMAT` | File type not supported |
| 413 | `FILE_TOO_LARGE` | Exceeds 10MB limit |
| 400 | `EMPTY_FILE` | No extractable content |
| 500 | `INTERNAL_ERROR` | Server processing error |

---

### Rate Limits

| Plan | Daily Requests |
|------|----------------|
| Free | 100 |
| Business | 10,000 |
| Enterprise | Unlimited |

Headers in response:
- `X-RateLimit-Limit`: Max requests per day
- `X-RateLimit-Remaining`: Requests left today
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

### Best Practices

1. **Store API keys securely** — Use environment variables, never hardcode
2. **Handle rate limits** — Check `X-RateLimit-Remaining`, implement backoff
3. **Validate file before upload** — Check size and type client-side
4. **Use appropriate plan** — Upgrade to Business/Enterprise for higher volume
5. **Monitor usage** — Check `/user/usage` endpoint or admin dashboard
6. **Rotate keys periodically** — Use `/api-keys/:id/regenerate` endpoint

---

### Testing with the API Playground

Visit the frontend at `http://localhost:5173/docs` for an interactive API playground where you can:
- Test extraction with sample files
- View request/response examples
- Generate code snippets in multiple languages

## Documentation

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

---

**EthioBridge API Platform** - Secure Document Extraction as a Service
