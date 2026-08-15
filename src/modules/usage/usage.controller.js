import { listUsageByUserId } from "../../db/models/api-usage.js";
import { findUserById } from "../../db/models/users.js";
import { getRateLimitSummaryByUserId } from "../../db/models/rate-limits.js";

function localDateKey(value = new Date()) {
  if (typeof value === "string") return value.slice(0, 10);
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

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
  const [result, rateLimitResult] = await Promise.all([
    listUsageByUserId(request.auth.userId),
    getRateLimitSummaryByUserId(request.auth.userId),
  ]);
  const rows = result.rows;

  const today = localDateKey();
  const thisMonth = today.slice(0, 7);

  const stats = {
    total: 0,
    daily: 0,
    monthly: 0,
    failed: 0,
    successful: 0,
  };

  for (const row of rows) {
    const dateStr = localDateKey(row.date);

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

  const rateLimit = rateLimitResult.rows[0] ?? {};
  const limit = Number(rateLimit.max_requests ?? 0);
  const remaining = Number(rateLimit.remaining_requests ?? 0);
  response.json({
    status: "success",
    usage: {
      ...stats,
      quota: {
        limit,
        used: Math.max(0, limit - remaining),
        remaining,
        resetAt: rateLimit.reset_at ?? null,
      },
    },
  });
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
