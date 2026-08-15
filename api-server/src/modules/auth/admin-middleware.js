import { AuthError } from "./auth-service.js";
import { verifyToken } from "./jwt-service.js";

function bearerToken(request) {
  const header = request.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function authenticateAdmin(request, next) {
  const token = bearerToken(request);
  if (!token) {
    next(new AuthError("UNAUTHORIZED", "A Bearer access token is required.", 401));
    return false;
  }

  try {
    const payload = verifyToken(token, "access");
    if (!payload.role) {
      throw new Error("Token is missing the admin role claim");
    }
    request.admin = { adminId: payload.sub, role: payload.role };
    return true;
  } catch {
    next(new AuthError("UNAUTHORIZED", "Access token is invalid or expired.", 401));
    return false;
  }
}

/**
 * Admin auth middleware.
 *
 * Verifies an access token with a `role` claim in the payload.
 * Runs before admin routes; sets `request.admin = { adminId, role }`.
 */
export function requireAdmin(request, _response, next) {
  if (authenticateAdmin(request, next)) {
    next();
  }
}

/**
 * Variant that additionally enforces the minimum admin role.
 *
 * role hierarchy: super_admin > support > read_only
 * - "super_admin" can do everything
 * - "support" can access non-ownership endpoints but not plan management
 * - "read_only" can only view
 *
 * @param {string[]} allowedRoles - e.g. ["super_admin", "support"]
 */
export function requireAdminRole(allowedRoles) {
  return function adminRoleGuard(request, _response, next) {
    if (!authenticateAdmin(request, next)) {
      return; // next() already called with error
    }

    if (!allowedRoles.includes(request.admin.role)) {
      next(
        new AuthError(
          "FORBIDDEN",
          "Your admin role does not have permission for this operation.",
          403,
        ),
      );
      return;
    }
    next();
  };
}
