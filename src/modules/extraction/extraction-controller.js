import { logActivity } from "../logging/activity-logger.js";
import { extractDocument } from "./extraction-service.js";

export async function extractHandler(request, response) {
  let statusCode = 200;
  let records = null;

  try {
    const result = await extractDocument(request.file);
    records = result.records;

    await logActivity({
      userId: request.apiKeyAuth.userId,
      action: "extract.success",
      request,
    });

    response.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    statusCode = typeof error?.status === "number" ? error.status : 500;
    await logActivity({
      userId: request.apiKeyAuth?.userId ?? null,
      action: "extract.failed",
      request,
    });
    throw error;
  } finally {
    if (request.file) {
      request.file.buffer = null;
    }
    request.extractionMetadata = { statusCode };
  }
}
