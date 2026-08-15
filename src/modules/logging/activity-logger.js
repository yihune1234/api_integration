import { createActivityLog } from "../../db/models/activity-logs.js";
import { logger } from "../../lib/logger.js";

export async function logActivity({
  userId = null,
  action,
  request,
}) {
  try {
    await createActivityLog({
      userId,
      action,
      ipAddress: request.ip,
      endpoint: request.originalUrl?.split("?")[0] ?? request.path,
    });
  } catch (error) {
    logger.error({ err: error, action }, "Unable to write activity log");
  }
}