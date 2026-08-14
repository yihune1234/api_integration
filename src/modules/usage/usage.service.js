import { upsertDailyUsage } from "../../db/models/api-usage.js";

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
  const today = new Date().toISOString().slice(0, 10);
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