import { query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createUsageRow({
  userId,
  apiKeyId,
  requestCount = 0,
  date,
  processingTimeMs = null,
  responseStatus = null,
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO api_usage
      (id, user_id, api_key_id, request_count, date, processing_time_ms, response_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, apiKeyId, requestCount, date, processingTimeMs, responseStatus],
  );
  return query("SELECT * FROM api_usage WHERE id = ?", [id]);
}

export function listUsageByUserId(userId) {
  return query(
    "SELECT * FROM api_usage WHERE user_id = ? ORDER BY date DESC",
    [userId],
  );
}

export async function upsertDailyUsage({
  userId,
  apiKeyId,
  date,
  processingTimeMs,
  responseStatus,
}) {
  await query(
    `INSERT INTO api_usage
      (id, user_id, api_key_id, request_count, date, processing_time_ms, response_status)
     VALUES (?, ?, ?, 1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       request_count = request_count + 1,
       processing_time_ms = VALUES(processing_time_ms),
       response_status = VALUES(response_status)`,
    [randomUUID(), userId, apiKeyId, date, processingTimeMs, responseStatus],
  );
  return query("SELECT * FROM api_usage WHERE api_key_id = ? AND date = ?", [apiKeyId, date]);
}
