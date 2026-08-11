import { Router } from "express";
import {
  changePasswordHandler,
  confirmPasswordResetHandler,
  loginHandler,
  refreshHandler,
  registerHandler,
  requestPasswordResetHandler,
} from "../modules/auth/auth-controller.js";
import { requireJwt } from "../modules/auth/auth-middleware.js";

const router = Router();

router.post("/auth/register", registerHandler);
router.post("/auth/login", loginHandler);
router.post("/auth/refresh", refreshHandler);
router.post("/auth/change-password", requireJwt, changePasswordHandler);
router.post("/auth/reset-password", requestPasswordResetHandler);
router.post("/auth/reset-password/confirm", confirmPasswordResetHandler);

export default router;