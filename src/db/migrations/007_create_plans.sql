CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  max_requests INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (id, name, max_requests)
VALUES
  (UUID(), 'free', 100),
  (UUID(), 'business', 10000),
  (UUID(), 'enterprise', 2147483647)
ON DUPLICATE KEY UPDATE name = VALUES(name);