CREATE TABLE IF NOT EXISTS rate_limits (
  id CHAR(36) PRIMARY KEY,
  api_key_id CHAR(36) NOT NULL UNIQUE,
  max_requests INTEGER NOT NULL,
  remaining_requests INTEGER NOT NULL,
  reset_at TIMESTAMP NOT NULL,
  CONSTRAINT rate_limits_api_key_id_fk FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);
