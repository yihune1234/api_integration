import { query } from "../connection.js";

/**
 * Admin dashboard helpers — aggregate counts across the platform.
 */

export function countUsers() {
  return query("SELECT COUNT(*) AS total FROM users");
}

export function countActiveUsers() {
  return query("SELECT COUNT(*) AS total FROM users WHERE status = 'active'");
}

export function countApiKeys() {
  return query("SELECT COUNT(*) AS total FROM api_keys");
}

export function countActiveApiKeys() {
  return query("SELECT COUNT(*) AS total FROM api_keys WHERE status = 'active'");
}

export function countRequestsTotal() {
  return query("SELECT COALESCE(SUM(request_count), 0) AS total FROM api_usage");
}

export function countRequestsToday() {
  return query(
    "SELECT COALESCE(SUM(request_count), 0) AS total FROM api_usage WHERE date = CURDATE()",
  );
}

export function countRequestsFailed() {
  return query(
    "SELECT COALESCE(SUM(request_count), 0) AS total FROM api_usage WHERE response_status >= 400",
  );
}

export function listAllUsers(limit = 100, offset = 0) {
  return query(
    `SELECT id, organization_name, contact_email, status, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
}

export function listAllApiKeys(limit = 100, offset = 0) {
  return query(
    `SELECT
       ak.id,
       ak.user_id,
       ak.key_prefix,
       ak.status,
       ak.plan,
       ak.expires_at,
       ak.created_at,
       u.organization_name AS user_organization,
       u.contact_email AS user_email
     FROM api_keys ak
     JOIN users u ON u.id = ak.user_id
     ORDER BY ak.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
}

export function forceRevokeApiKey(id) {
  return query(
    `UPDATE api_keys SET status = 'revoked'
     WHERE id = ? AND status = 'active'`,
    [id],
  );
}

export function listAllActivityLogs({
  limit = 100,
  offset = 0,
  userId = null,
  action = null,
  fromDate = null,
  toDate = null,
} = {}) {
  const conditions = [];
  const values = [];

  if (userId) {
    conditions.push("user_id = ?");
    values.push(userId);
  }
  if (action) {
    conditions.push("action = ?");
    values.push(action);
  }
  if (fromDate) {
    conditions.push("timestamp >= ?");
    values.push(fromDate);
  }
  if (toDate) {
    conditions.push("timestamp <= ?");
    values.push(toDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(limit, offset);

  return query(
    `SELECT
       al.id,
       al.user_id,
       al.action,
       al.ip_address,
       al.endpoint,
       al.timestamp,
       u.organization_name AS user_organization,
       u.contact_email AS user_email
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.timestamp DESC
     LIMIT ? OFFSET ?`,
    values,
  );
}

export function listAllPlans() {
  return query(
    "SELECT id, name, max_requests FROM plans ORDER BY max_requests ASC",
  );
}

export function updatePlanLimits(planId, maxRequests) {
  return query("UPDATE plans SET max_requests = ? WHERE id = ?", [
    maxRequests,
    planId,
  ]);
}