import { Router } from "express";
import { requireJwt } from "../modules/auth/auth-middleware.js";
import {
  getUserProfileHandler,
  getUserUsageHandler,
} from "../modules/usage/usage.controller.js";

const router = Router();

router.get("/user/profile", requireJwt, getUserProfileHandler);
router.get("/user/usage", requireJwt, getUserUsageHandler);

export default router;
