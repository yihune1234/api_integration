CREATE TABLE IF NOT EXISTS premium_requests (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  requested_plan VARCHAR(20) NOT NULL,
  payment_reference VARCHAR(255),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT premium_requests_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT premium_requests_reviewed_by_fk FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT premium_requests_plan_check CHECK (requested_plan IN ('business', 'enterprise')),
  CONSTRAINT premium_requests_payment_status_check CHECK (payment_status IN ('pending', 'mock_confirmed', 'failed')),
  CONSTRAINT premium_requests_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_premium_requests_user_id ON premium_requests(user_id);
CREATE INDEX idx_premium_requests_approval_status ON premium_requests(approval_status);