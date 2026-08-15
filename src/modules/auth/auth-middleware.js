import { AuthError } from "./auth-service.js";
import { verifyToken } from "./jwt-service.js";

function bearerToken(request) {
  const header = request.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export function requireJwt(request, _response, next) {
  const token = bearerToken(request);
  if (!token) {
    next(new AuthError("UNAUTHORIZED", "A Bearer access token is required.", 401));
    return;
  }

  try {
    const payload = verifyToken(token, "access");
    if (payload.role) {
      throw new Error("Admin tokens cannot access organization routes");
    }
    request.auth = { userId: payload.sub, tokenType: payload.type };
    next();
  } catch {
    next(new AuthError("UNAUTHORIZED", "Access token is invalid or expired.", 401));
  }
}
