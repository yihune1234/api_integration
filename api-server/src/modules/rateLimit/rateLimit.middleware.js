import { checkRateLimit, RateLimitError } from "./rateLimit.service.js";

/**
 * Express middleware that runs immediately after requireApiKey and before multer.
 *
 * If the API key has exhausted its daily quota the request is rejected with 429
 * before any file processing (or even file upload) begins.
 */
export async function rateLimitMiddleware(request, _response, next) {
  try {
    const rateLimit = await checkRateLimit(request.apiKeyAuth.apiKeyId);
    request.rateLimit = {
      remaining: rateLimit.remaining_requests,
      max: rateLimit.max_requests,
      resetAt: rateLimit.reset_at,
    };
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      next(error);
      return;
    }
    next(error);
  }
}