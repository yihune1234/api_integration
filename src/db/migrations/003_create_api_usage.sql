CREATE TABLE IF NOT EXISTS api_usage (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  api_key_id CHAR(36) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  processing_time_ms INTEGER,
  response_status INTEGER,
  UNIQUE (api_key_id, date),
  CONSTRAINT api_usage_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT api_usage_api_key_id_fk FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
