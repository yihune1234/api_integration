CREATE TABLE IF NOT EXISTS api_keys (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT api_keys_status_check CHECK (status IN ('active', 'revoked', 'expired')),
  CONSTRAINT api_keys_plan_check CHECK (plan IN ('free', 'business', 'enterprise')),
  CONSTRAINT api_keys_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
