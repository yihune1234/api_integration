import { query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createApiKey({
  userId,
  keyHash,
  keyPrefix,
  status = "active",
  plan = "free",
  expiresAt = null,
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO api_keys
      (id, user_id, key_hash, key_prefix, status, plan, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, keyHash, keyPrefix, status, plan, expiresAt],
  );
  return query(
    "SELECT id, user_id, key_prefix, status, plan, expires_at, created_at FROM api_keys WHERE id = ?",
    [id],
  );
}

export function listApiKeysByUserId(userId) {
  return query(
    `SELECT id, user_id, key_prefix, status, plan, expires_at, created_at
     FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
}

export function findApiKeyByHash(keyHash) {
  return query("SELECT * FROM api_keys WHERE key_hash = ?", [keyHash]);
}

export function findApiKeyByIdForUser(id, userId) {
  return query("SELECT * FROM api_keys WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

export async function revokeApiKeyByIdForUser(id, userId) {
  await query(
    `UPDATE api_keys SET status = 'revoked'
     WHERE id = ? AND user_id = ? AND status = 'active'`,
    [id, userId],
  );
  return query(
    "SELECT id, user_id, key_prefix, status, plan, expires_at, created_at FROM api_keys WHERE id = ? AND user_id = ? AND status = 'revoked'",
    [id, userId],
  );
}

/**
 * Integration point for the premium module: apply a plan change to all of a
 * user's active API keys. Used when a premium request is approved.
 */
export function updateApiKeyPlan({ userId, plan }) {
  return query(
    `UPDATE api_keys SET plan = ?
     WHERE user_id = ? AND status = 'active'`,
    [plan, userId],
  );
}
