import multer from "multer";
import { logger } from "../lib/logger.js";

export function errorHandler(error, request, response, _next) {
  // Malformed JSON body from express.json() → 422 VALIDATION_ERROR
  const isBodyParseError = error?.type === "entity.parse.failed";
  const status =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? 413
      : isBodyParseError
        ? 422
        : typeof error?.status === "number"
          ? error.status
          : 500;
  const errorCode =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "FILE_TOO_LARGE"
      : isBodyParseError
        ? "VALIDATION_ERROR"
        : typeof error?.code === "string"
          ? error.code
          : "INTERNAL_ERROR";
  const message =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "The uploaded file exceeds the 10 MB limit."
      : isBodyParseError
        ? "The request body contains malformed JSON."
        : status === 500
          ? "An unexpected error occurred."
          : error.message;

  if (status === 500) {
    logger.error({ err: error, path: request.path }, "Unhandled request error");
  } else {
    request.log.warn({ errorCode, path: request.path }, "Request rejected");
  }

  response.status(status).json({
    status: "error",
    errorCode,
    message,
    timestamp: new Date().toISOString(),
  });
}