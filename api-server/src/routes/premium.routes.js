import { Router } from "express";
import { requireJwt } from "../modules/auth/auth-middleware.js";
import { requireAdmin } from "../modules/auth/admin-middleware.js";
import { requireAdminOrSuperAdmin } from "../modules/premium/premium.middleware.js";
import {
  premiumRequestHandler,
  premiumStatusHandler,
  listPendingRequestsHandler,
  approveRequestHandler,
  rejectRequestHandler,
} from "../modules/premium/premium.controller.js";

const router = Router();

// User-facing routes (org JWT)
router.post("/premium/request", requireJwt, premiumRequestHandler);
router.get("/premium/status", requireJwt, premiumStatusHandler);

// Admin routes — list visible to any authenticated admin; approve/reject only
// for super_admin or admin.
router.get("/admin/premium-requests", requireAdmin, listPendingRequestsHandler);
router.post("/admin/premium-requests/:id/approve", requireAdminOrSuperAdmin, approveRequestHandler);
router.post("/admin/premium-requests/:id/reject", requireAdminOrSuperAdmin, rejectRequestHandler);

export default router;
