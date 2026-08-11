import { logActivity } from "../logging/activity-logger.js";
import { extractDocument } from "./extraction-service.js";
import { recordExtractionUsage } from "../usage/usage.service.js";

export async function extractHandler(request, response) {
  const startedAt = process.hrtime.bigint();
  let statusCode = 200;
  let records = null;

  try {
    const result = await extractDocument(request.file);
    records = result.records;

    const processingTimeMs = Number(process.hrtime.bigint() - startedAt);
    await Promise.all([
      logActivity({
        userId: request.apiKeyAuth.userId,
        action: "extract.success",
        request,
      }),
      recordExtractionUsage({
        userId: request.apiKeyAuth.userId,
        apiKeyId: request.apiKeyAuth.apiKeyId,
        processingTimeMs,
        responseStatus: 200,
      }),
    ]);

    response.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    statusCode = typeof error?.status === "number" ? error.status : 500;
    const processingTimeMs = Number(process.hrtime.bigint() - startedAt);
    await Promise.all([
      logActivity({
        userId: request.apiKeyAuth?.userId ?? null,
        action: "extract.failed",
        request,
      }),
      recordExtractionUsage({
        userId: request.apiKeyAuth?.userId ?? null,
        apiKeyId: request.apiKeyAuth?.apiKeyId ?? null,
        processingTimeMs,
        responseStatus: statusCode,
      }),
    ]);
    throw error;
  } finally {
    if (request.file) {
      request.file.buffer = null;
    }
    request.extractionMetadata = { statusCode };
  }
}
