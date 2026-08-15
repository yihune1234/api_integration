import { upsertDailyUsage } from "../../db/models/api-usage.js";

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Record usage for an extraction request (success or failure).
 *
 * Upserts the api_usage row for (api_key_id, today's date):
 * - increments request_count
 * - records processing_time_ms and response_status
 *
 * Never throws — usage recording must never break the extraction flow.
 */
export async function recordExtractionUsage({
  userId,
  apiKeyId,
  processingTimeMs,
  responseStatus,
}) {
  const today = localDateKey();
  try {
    await upsertDailyUsage({
      userId,
      apiKeyId,
      date: today,
      processingTimeMs,
      responseStatus,
    });
  } catch {
    // swallow — non-critical
  }
}
