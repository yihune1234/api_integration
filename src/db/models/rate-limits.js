import { pool, query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createRateLimit({
  apiKeyId,
  maxRequests,
  remainingRequests = maxRequests,
  resetAt,
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO rate_limits
      (id, api_key_id, max_requests, remaining_requests, reset_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, apiKeyId, maxRequests, remainingRequests, resetAt],
  );
  return query("SELECT * FROM rate_limits WHERE id = ?", [id]);
}

export function findRateLimitByApiKeyId(apiKeyId) {
  return query("SELECT * FROM rate_limits WHERE api_key_id = ?", [apiKeyId]);
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

    const now = new Date();
    if (new Date(row.reset_at).getTime() <= now.getTime()) {
      const resetAt = new Date(now);
      resetAt.setUTCHours(24, 0, 0, 0);
      await client.query(
        `UPDATE rate_limits
         SET remaining_requests = max_requests, reset_at = ?
         WHERE api_key_id = ?`,
        [resetAt, apiKeyId],
      );
      row.remaining_requests = row.max_requests;
      row.reset_at = resetAt;
    }

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
