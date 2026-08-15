import { checkRateLimit, RateLimitError } from "./rateLimit.service.js";
import { recordExtractionUsage } from "../usage/usage.service.js";

/**
 * Express middleware that runs immediately after requireApiKey and before multer.
 *
 * If the API key has exhausted its daily quota the request is rejected with 429
 * before any file processing (or even file upload) begins.
 */
export async function rateLimitMiddleware(request, response, next) {
  try {
    const startedAt = process.hrtime.bigint();
    const rateLimit = await checkRateLimit(request.apiKeyAuth.apiKeyId);
    request.rateLimit = {
      remaining: rateLimit.remaining_requests,
      max: rateLimit.max_requests,
      resetAt: rateLimit.reset_at,
    };
    response.set({
      "X-RateLimit-Limit": String(rateLimit.max_requests),
      "X-RateLimit-Remaining": String(rateLimit.remaining_requests),
      "X-RateLimit-Reset": new Date(rateLimit.reset_at).toISOString(),
    });
    // This route is the common entry point for Playground and external API-key
    // integrations. Record its final HTTP outcome once, including multer and
    // parsing failures that never reach the extraction controller.
    response.once("finish", () => {
      const processingTimeMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      void recordExtractionUsage({
        userId: request.apiKeyAuth.userId,
        apiKeyId: request.apiKeyAuth.apiKeyId,
        processingTimeMs: Math.round(processingTimeMs),
        responseStatus: response.statusCode,
      });
    });
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      next(error);
      return;
    }
    next(error);
  }
}
