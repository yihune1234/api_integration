import { Router } from "express";
import { requireApiKey } from "../modules/api-keys/api-key-middleware.js";

const router = Router();

router.get("/v1/key-check", requireApiKey, (request, response) => {
  response.json({
    status: "ok",
    plan: request.apiKeyAuth.plan,
  });
});

export default router;