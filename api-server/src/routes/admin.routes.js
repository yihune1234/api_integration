
import { Router } from "express";
import { requireAdminRole } from "../modules/auth/admin-middleware.js";
import {
  adminLoginHandler,
  dashboardHandler,
  listApiKeysHandler,
  listLogsHandler,
  listPlansHandler,
  listUsersHandler,
  revokeApiKeyHandler,
  updatePlanHandler,
} from "../modules/admin/admin.controller.js";

const router = Router();

// Public: admin login
router.post("/admin/login", adminLoginHandler);

// Authenticated admin routes
router.get(
  "/admin/users",
  requireAdminRole(["super_admin", "admin", "support", "read_only"]),
  listUsersHandler,
);
router.get(
  "/admin/api-keys",
  requireAdminRole(["super_admin", "admin", "support", "read_only"]),
  listApiKeysHandler,
);
router.post(
  "/admin/api-keys/:id/revoke",
  requireAdminRole(["super_admin", "admin", "support"]),
  revokeApiKeyHandler,
);
router.get(
  "/admin/logs",
  requireAdminRole(["super_admin", "admin", "support", "read_only"]),
  listLogsHandler,
);
router.get(
  "/admin/plans",
  requireAdminRole(["super_admin", "admin", "support", "read_only"]),
  listPlansHandler,
);
router.put(
  "/admin/plans/:id",
  requireAdminRole(["super_admin"]),
  updatePlanHandler,
);
router.get(
  "/admin/dashboard",
  requireAdminRole(["super_admin", "admin", "support", "read_only"]),
  dashboardHandler,
);

export default router;
