import { Router } from "express";
import { requireJwt } from "../modules/auth/auth-middleware.js";
import {
  createApiKeyHandler,
  listApiKeysHandler,
  regenerateApiKeyHandler,
  revokeApiKeyHandler,
} from "../modules/api-keys/api-key-controller.js";

const router = Router();

router.use("/api-keys", requireJwt);
router.post("/api-keys", createApiKeyHandler);
router.get("/api-keys", listApiKeysHandler);
router.post("/api-keys/:id/revoke", revokeApiKeyHandler);
router.post("/api-keys/:id/regenerate", regenerateApiKeyHandler);

export default router;