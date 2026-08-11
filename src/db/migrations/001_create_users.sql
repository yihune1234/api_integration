CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled', 'pending'))
);
