import { Router } from "express";
import { uploadDocument } from "../middleware/multer-config.js";
import { requireApiKey } from "../modules/api-keys/api-key-middleware.js";
import { rateLimitMiddleware } from "../modules/rateLimit/rateLimit.middleware.js";
import { extractHandler } from "../modules/extraction/extraction-controller.js";

const router = Router();

router.post(
  "/v1/extract",
  requireApiKey,
  rateLimitMiddleware,
  uploadDocument.single("file"),
  extractHandler,
);

export default router;
