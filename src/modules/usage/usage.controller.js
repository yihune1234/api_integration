import { listUsageByUserId } from "../../db/models/api-usage.js";
import { findUserById } from "../../db/models/users.js";

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

/**
 * GET /user/profile
 *
 * Returns the authenticated organization's profile.
 */
export async function getUserProfileHandler(request, response) {
  const result = await findUserById(request.auth.userId);
  const user = result.rows[0];
  if (!user) {
    const error = new Error("User account was not found.");
    error.code = "NOT_FOUND";
    error.status = 404;
    throw error;
  }

  response.json({
    status: "success",
    user: {
      id: user.id,
      organizationName: user.organization_name,
      contactEmail: user.contact_email,
      status: user.status,
      createdAt: user.created_at,
    },
  });
}