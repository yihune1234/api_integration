import { pool, query } from "../connection.js";
import { randomUUID } from "node:crypto";

/**
 * SQL expression for the next UTC-midnight reset time.
 *
 * Using DATE(UTC_TIMESTAMP()) + 1 day avoids any JS Date ↔ MySQL TIMESTAMP
 * timezone round-trip ambiguity (which previously caused the daily window to
 * reset on every request).
 */
const NEXT_UTC_MIDNIGHT = "DATE_ADD(DATE(UTC_TIMESTAMP()), INTERVAL 1 DAY)";

export async function createRateLimit({
  apiKeyId,
  maxRequests,
  remainingRequests = maxRequests,
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO rate_limits
      (id, api_key_id, max_requests, remaining_requests, reset_at)
     VALUES (?, ?, ?, ?, ${NEXT_UTC_MIDNIGHT})`,
    [id, apiKeyId, maxRequests, remainingRequests],
  );
  return query("SELECT * FROM rate_limits WHERE id = ?", [id]);
}

export function findRateLimitByApiKeyId(apiKeyId) {
  return query("SELECT * FROM rate_limits WHERE api_key_id = ?", [apiKeyId]);
}

export function getRateLimitSummaryByUserId(userId) {
  return query(
    `SELECT
       COALESCE(SUM(rl.max_requests), 0) AS max_requests,
       COALESCE(SUM(rl.remaining_requests), 0) AS remaining_requests,
       MIN(rl.reset_at) AS reset_at
     FROM rate_limits rl
     JOIN api_keys ak ON ak.id = rl.api_key_id
     WHERE ak.user_id = ? AND ak.status = 'active'`,
    [userId],
  );
}

export function getPlatformRateLimitSummary() {
  return query(
    `SELECT
       COALESCE(SUM(rl.max_requests), 0) AS max_requests,
       COALESCE(SUM(rl.remaining_requests), 0) AS remaining_requests
     FROM rate_limits rl
     JOIN api_keys ak ON ak.id = rl.api_key_id
     WHERE ak.status = 'active'`,
  );
}

/**
 * Integration point for the premium module: propagate a max-request limit to
 * all rate-limit rows belonging to a user's active keys. Used when a premium
 * request is approved (keeps api_keys.plan and rate_limits.max_requests in
 * sync through existing models, not duplicated premium queries).
 */
export function updateRateLimitMax({ userId, maxRequests }) {
  return query(
    `UPDATE rate_limits rl
     JOIN api_keys ak ON ak.id = rl.api_key_id
     SET rl.max_requests = ?, rl.remaining_requests = ?
     WHERE ak.user_id = ? AND ak.status = 'active'`,
    [maxRequests, maxRequests, userId],
  );
}

export async function consumeRateLimit(apiKeyId) {
  const client = await pool.getConnection();
  try {
    await client.beginTransaction();
    const [rows] = await client.query(
      `SELECT *
       FROM rate_limits
       WHERE api_key_id = ?
       FOR UPDATE`,
      [apiKeyId],
    );
    const row = rows[0];
    if (!row) {
      const error = new Error("Rate limit configuration was not found.");
      error.code = "INTERNAL_ERROR";
      error.status = 500;
      throw error;
    }

    // Reset the window if reset_at has passed. The comparison happens in SQL
    // against UTC_TIMESTAMP() to avoid JS Date ↔ TIMESTAMP timezone drift.
    await client.query(
      `UPDATE rate_limits
       SET remaining_requests = max_requests, reset_at = ${NEXT_UTC_MIDNIGHT}
       WHERE api_key_id = ? AND reset_at <= UTC_TIMESTAMP()`,
      [apiKeyId],
    );

    // Re-read after the (possibly applied) reset.
    const [refreshedRows] = await client.query(
      "SELECT * FROM rate_limits WHERE api_key_id = ? FOR UPDATE",
      [apiKeyId],
    );
    const refreshed = refreshedRows[0] ?? row;
    row.remaining_requests = refreshed.remaining_requests;
    row.reset_at = refreshed.reset_at;

    if (row.remaining_requests <= 0) {
      const error = new Error("The API key has reached its daily request limit.");
      error.code = "RATE_LIMIT_EXCEEDED";
      error.status = 429;
      error.resetAt = row.reset_at;
      throw error;
    }

    await client.query(
      `UPDATE rate_limits
       SET remaining_requests = remaining_requests - 1
       WHERE api_key_id = ?`,
      [apiKeyId],
    );
    const [updated] = await client.query("SELECT * FROM rate_limits WHERE api_key_id = ?", [apiKeyId]);
    await client.commit();
    return updated[0];
  } catch (error) {
    await client.rollback();
    throw error;
  } finally {
    client.release();
  }
}
