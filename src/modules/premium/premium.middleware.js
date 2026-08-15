import { AuthError } from "../auth/auth-service.js";
import { verifyToken } from "../auth/jwt-service.js";

function bearerToken(request) {
  const header = request.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/**
 * Require the admin JWT to carry role 'super_admin' or 'admin'.
 *
 * support/read_only admins are explicitly forbidden from approving/rejecting
 * premium requests — they can still view the list via the normal admin auth.
 */
export function requireAdminOrSuperAdmin(request, _response, next) {
  const token = bearerToken(request);
  if (!token) {
    next(new AuthError("UNAUTHORIZED", "A Bearer access token is required.", 401));
    return;
  }

  let payload;
  try {
    payload = verifyToken(token, "access");
  } catch {
    next(new AuthError("UNAUTHORIZED", "Access token is invalid or expired.", 401));
    return;
  }

  if (!payload.role) {
    next(new AuthError("UNAUTHORIZED", "Token is missing the admin role claim.", 401));
    return;
  }

  if (!["super_admin", "admin"].includes(payload.role)) {
    next(
      new AuthError(
        "FORBIDDEN_ROLE",
        "Your admin role does not have permission to approve premium requests.",
        403,
      ),
    );
    return;
  }

  request.admin = { adminId: payload.sub, role: payload.role };
  next();
}
