# EthioBridge API Platform

A secure document extraction API platform that accepts JSON, XML, CSV, and Excel files, extracts their data, converts it into a standardized JSON format, and returns it immediately. Built as a metered API product with self-serve account management, API keys, usage tracking, and plan-based rate limiting.

## 🏗️ Architecture

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

## 🔐 Authentication

Two separate authentication mechanisms:

1. **JWT (Account/Admin)** - For organizations managing accounts, API keys, and viewing dashboards
2. **API Key (Bearer)** - For programmatic document extraction calls

### API Key Plans
| Plan | Daily Limit |
|------|-------------|
| Free | 100 requests/day |
| Business | 10,000 requests/day |
| Enterprise | Unlimited/Negotiated |

## 📚 API Endpoints (MVP)

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

## 🗄️ Database Schema

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

## 📁 Project Structure

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

## 📖 Documentation

- [Backend API Specification](api-server/docs/EthioBridge_API_Platform_Specification.md)
- [Database Schema & Folder Structure](api-server/docs/EthioBridge_API_DB_Schema_and_Folder_Structure.md)
- [API Contract for Frontend](api-server/docs/EthioBridge_Backend_API_Contract_for_Frontend.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

---

**EthioBridge API Platform** - Secure Document Extraction as a Service