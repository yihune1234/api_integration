import { listUsageByUserId } from "../../db/models/api-usage.js";

/**
 * GET /user/usage
 *
 * Returns aggregated usage stats for the authenticated user:
 * - total: lifetime request count
 * - daily: today's request count
 * - monthly: this month's request count
 * - failed: total failed requests
 * - successful: total successful requests
 */
export async function getUserUsageHandler(request, response) {
  const result = await listUsageByUserId(request.auth.userId);
  const rows = result.rows;

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const stats = {
    total: 0,
    daily: 0,
    monthly: 0,
    failed: 0,
    successful: 0,
  };

  for (const row of rows) {
    const dateStr =
      typeof row.date === "string"
        ? row.date.slice(0, 10)
        : new Date(row.date).toISOString().slice(0, 10);

    stats.total += row.request_count;

    if (dateStr === today) {
      stats.daily += row.request_count;
    }

    if (dateStr.startsWith(thisMonth)) {
      stats.monthly += row.request_count;
    }

    if (row.response_status != null) {
      if (row.response_status >= 200 && row.response_status < 300) {
        stats.successful += row.request_count;
      } else {
        stats.failed += row.request_count;
      }
    }
  }

  response.json({ status: "success", usage: stats });
}