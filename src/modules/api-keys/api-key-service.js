import crypto from "node:crypto";
import {
  createApiKey,
  findApiKeyByIdForUser,
  listApiKeysByUserId,
  revokeApiKeyByIdForUser,
} from "../../db/models/api-keys.js";
import { createRateLimit } from "../../db/models/rate-limits.js";
import { maxRequestsForPlan, nextDailyReset } from "../../config/plans.js";
import { logActivity } from "../logging/activity-logger.js";

export class ApiKeyError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function rawKey() {
  return `eb_live_${crypto.randomBytes(32).toString("base64url")}`;
}

function keyHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function keyPrefix(value) {
  return value.slice(0, 16);
}

function publicKey(row) {
  return {
    id: row.id,
    keyPrefix: row.key_prefix,
    status: row.status,
    plan: row.plan,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function generateForUser(userId, plan, request, action) {
  if (!["free", "business", "enterprise"].includes(plan)) {
    throw new ApiKeyError("VALIDATION_ERROR", "Unsupported plan.", 422);
  }

  const key = rawKey();
  const result = await createApiKey({
    userId,
    keyHash: keyHash(key),
    keyPrefix: keyPrefix(key),
    plan,
  });
  const row = result.rows[0];
  await createRateLimit({
    apiKeyId: row.id,
    maxRequests: maxRequestsForPlan(plan),
    resetAt: nextDailyReset(),
  });
  await logActivity({ userId, action, request });

  return {
    key,
    apiKey: publicKey(row),
    warning: "Copy this key now. It will not be shown again.",
  };
}

export function listForUser(userId) {
  return listApiKeysByUserId(userId).then((result) =>
    result.rows.map(publicKey),
  );
}

export async function createForUser(userId, body, request) {
  const plan = body.plan ?? "free";
  return generateForUser(userId, plan, request, "key.created");
}

export async function revokeForUser(userId, id, request) {
  const result = await revokeApiKeyByIdForUser(id, userId);
  if (!result.rows[0]) {
    throw new ApiKeyError("NOT_FOUND", "API key was not found or already revoked.", 404);
  }
  await logActivity({ userId, action: "key.revoked", request });
  return { apiKey: publicKey(result.rows[0]) };
}

export async function regenerateForUser(userId, id, request) {
  const existing = await findApiKeyByIdForUser(id, userId);
  const oldKey = existing.rows[0];
  if (!oldKey) {
    throw new ApiKeyError("NOT_FOUND", "API key was not found.", 404);
  }

  await revokeForUser(userId, id, request);
  return generateForUser(userId, oldKey.plan, request, "key.regenerated");
}