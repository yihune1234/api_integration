import { consumeRateLimit } from "../../db/models/rate-limits.js";

export class RateLimitError extends Error {
  constructor(code, message, status = 429, resetAt = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.resetAt = resetAt;
  }
}

/**
 * Check and consume one request from the rate limit bucket for the given api_key_id.
 *
 * - If reset_at has passed, remaining_requests is reset to max_requests first.
 * - If remaining_requests <= 0, throws RATE_LIMIT_EXCEEDED (429).
 * - Otherwise decrements remaining_requests by 1 and returns the updated row.
 */
export async function checkRateLimit(apiKeyId) {
  try {
    const row = await consumeRateLimit(apiKeyId);
    return row;
  } catch (error) {
    if (error.code === "RATE_LIMIT_EXCEEDED") {
      throw new RateLimitError(
        "RATE_LIMIT_EXCEEDED",
        error.message,
        429,
        error.resetAt,
      );
    }
    throw error;
  }
}