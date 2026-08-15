import crypto from "node:crypto";
import { findApiKeyByHash } from "../../db/models/api-keys.js";
import { findApprovedPremiumRequestByUserIdAndPlan } from "../../db/models/premiumRequest.model.js";
import { ApiKeyError } from "./api-key-service.js";

function getBearerKey(request) {
  const authorization = request.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

export async function requireApiKey(request, _response, next) {
  const rawKey = getBearerKey(request);
  if (!rawKey) {
    next(new ApiKeyError("MISSING_API_KEY", "A Bearer API key is required.", 401));
    return;
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const result = await findApiKeyByHash(keyHash);
  const apiKey = result.rows[0];

  if (!apiKey || apiKey.status !== "active") {
    next(
      new ApiKeyError(
        "INVALID_API_KEY",
        "The provided API key is invalid or revoked.",
        401,
      ),
    );
    return;
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at).getTime() <= Date.now()) {
    next(
      new ApiKeyError(
        "INVALID_API_KEY",
        "The provided API key is expired.",
        401,
      ),
    );
    return;
  }

  // Enforce the entitlement at the point where a key is actually used. This
  // also blocks any paid keys created before the server-side creation guard
  // was introduced.
  if (apiKey.plan !== "free") {
    const approval = await findApprovedPremiumRequestByUserIdAndPlan(
      apiKey.user_id,
      apiKey.plan,
    );
    if (!approval.rows[0]) {
      next(
        new ApiKeyError(
          "PREMIUM_APPROVAL_REQUIRED",
          "This API key's paid plan requires an approved premium request.",
          403,
        ),
      );
      return;
    }
  }

  request.apiKeyAuth = {
    userId: apiKey.user_id,
    apiKeyId: apiKey.id,
    plan: apiKey.plan,
  };
  next();
}
