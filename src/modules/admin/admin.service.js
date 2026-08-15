import {
  countActiveApiKeys,
  countActiveUsers,
  countApiKeys,
  countRequestsFailed,
  countRequestsToday,
  countRequestsThisMonth,
  countRequestsTotal,
  countUsers,
  forceRevokeApiKey,
  listAllActivityLogs,
  listAllApiKeys,
  listAllPlans,
  listAllUsers,
  updatePlanLimits,
} from "../../db/models/admin-queries.js";
import { getPlatformRateLimitSummary } from "../../db/models/rate-limits.js";
import { findAdminByEmail } from "../../db/models/admins.js";
import { createAdmin } from "../../db/models/admins.js";
import { hashPassword, verifyPassword } from "../auth/password-service.js";
import { issueAdminAccessToken } from "../auth/jwt-service.js";
import { logActivity } from "../logging/activity-logger.js";

export class AdminError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function numberParam(value, fallback, { min = 0, max = 1000 } = {}) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

export async function listUsers(options = {}) {
  const limit = numberParam(options.limit, 100, { max: 1000 });
  const offset = numberParam(options.offset, 0);
  const result = await listAllUsers(limit, offset);
  return { users: result.rows, limit, offset };
}

export async function listApiKeys(options = {}) {
  const limit = numberParam(options.limit, 100, { max: 1000 });
  const offset = numberParam(options.offset, 0);
  const result = await listAllApiKeys(limit, offset);
  return { apiKeys: result.rows, limit, offset };
}

export async function revokeApiKey(apiKeyId) {
  if (!apiKeyId) {
    throw new AdminError("VALIDATION_ERROR", "API key id is required.", 422);
  }
  const result = await forceRevokeApiKey(apiKeyId);
  if (result.rowCount === 0) {
    throw new AdminError("NOT_FOUND", "API key was not found or already revoked.", 404);
  }
  return { message: "API key revoked successfully." };
}

export async function listLogs(options = {}) {
  const limit = numberParam(options.limit, 100, { max: 1000 });
  const offset = numberParam(options.offset, 0);
  const result = await listAllActivityLogs({
    limit,
    offset,
    userId: options.userId,
    action: options.action,
    fromDate: options.fromDate,
    toDate: options.toDate,
  });
  return { logs: result.rows, limit, offset };
}

export async function listPlans() {
  const result = await listAllPlans();
  return { plans: result.rows };
}

export async function updatePlan(planId, body) {
  const maxRequests = Number(body.maxRequests);
  if (!Number.isInteger(maxRequests) || maxRequests <= 0) {
    throw new AdminError(
      "VALIDATION_ERROR",
      "maxRequests must be a positive integer.",
      422,
    );
  }
  await updatePlanLimits(planId, maxRequests);
  const result = await listAllPlans();
  return { plans: result.rows, message: "Plan limits updated." };
}

export async function dashboardStats() {
  const [
    totalUsers,
    activeUsers,
    totalApiKeys,
    activeApiKeys,
    totalRequests,
    todayRequests,
    monthlyRequests,
    failedRequests,
    rateLimitSummary,
  ] = await Promise.all([
    countUsers(),
    countActiveUsers(),
    countApiKeys(),
    countActiveApiKeys(),
    countRequestsTotal(),
    countRequestsToday(),
    countRequestsThisMonth(),
    countRequestsFailed(),
    getPlatformRateLimitSummary(),
  ]);

  const num = (r) => Number(r.rows[0]?.total ?? 0);
  const quota = rateLimitSummary.rows[0] ?? {};
  const limit = Number(quota.max_requests ?? 0);
  const remaining = Number(quota.remaining_requests ?? 0);

  return {
    users: { total: num(totalUsers), active: num(activeUsers) },
    apiKeys: { total: num(totalApiKeys), active: num(activeApiKeys) },
    requests: {
      total: num(totalRequests),
      today: num(todayRequests),
      monthly: num(monthlyRequests),
      failed: num(failedRequests),
      quota: { limit, used: Math.max(0, limit - remaining), remaining },
    },
  };
}

// ── Admin auth ────────────────────────────────────────────────────────────

/**
 * Admin login issues a JWT scoped with a role claim.
 */
export async function loginAdmin(body, request) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    throw new AdminError("VALIDATION_ERROR", "email and password are required.", 422);
  }

  const result = await findAdminByEmail(email);
  const admin = result.rows[0];

  if (!admin || !verifyPassword(password, admin.password_hash)) {
    await logActivity({ action: "admin.login.failed", request });
    throw new AdminError("UNAUTHORIZED", "Invalid email or password.", 401);
  }

  await logActivity({ action: "admin.login", request });
  return {
    accessToken: issueAdminAccessToken(admin.id, admin.role),
    tokenType: "Bearer",
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  };
}

/**
 * Seed a default admin (idempotent — used in development only).
 */
export async function seedAdmin({ email, password, role = "super_admin" }) {
  const existing = await findAdminByEmail(email);
  if (existing.rows[0]) return existing.rows[0];

  return createAdmin({
    email,
    passwordHash: hashPassword(password),
    role,
  }).then((r) => r.rows[0]);
}
