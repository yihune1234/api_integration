import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
} from "../../db/models/users.js";
import { logActivity } from "../logging/activity-logger.js";
import {
  issueAccessToken,
  issueRefreshToken,
  issueResetToken,
  verifyToken,
} from "./jwt-service.js";
import { hashPassword, verifyPassword } from "./password-service.js";

export class AuthError extends Error {
  constructor(code, message, status = 401) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AuthError(
      "VALIDATION_ERROR",
      `${field} is required.`,
      422,
    );
  }
  return value.trim();
}

function validatePassword(password, field = "password") {
  if (typeof password !== "string" || password.length < 8) {
    throw new AuthError(
      "VALIDATION_ERROR",
      `${field} must be at least 8 characters.`,
      422,
    );
  }
  return password;
}

async function getUserByEmail(email) {
  const result = await findUserByEmail(email);
  return result.rows[0] ?? null;
}

async function getUserById(id) {
  const result = await findUserById(id);
  return result.rows[0] ?? null;
}

function tokensFor(userId) {
  return {
    accessToken: issueAccessToken(userId),
    refreshToken: issueRefreshToken(userId),
    tokenType: "Bearer",
  };
}

export async function register(body, request) {
  const organizationName = requiredString(body.organizationName, "organizationName");
  const contactEmail = normalizeEmail(requiredString(body.contactEmail, "contactEmail"));
  const password = validatePassword(body.password);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new AuthError("VALIDATION_ERROR", "contactEmail must be valid.", 422);
  }

  const existing = await getUserByEmail(contactEmail);
  if (existing) {
    throw new AuthError(
      "VALIDATION_ERROR",
      "An organization with this email already exists.",
      422,
    );
  }

  const result = await createUser({
    organizationName,
    contactEmail,
    passwordHash: hashPassword(password),
  });
  const user = result.rows[0];
  await logActivity({ userId: user.id, action: "auth.register", request });

  return {
    user: {
      id: user.id,
      organizationName: user.organization_name,
      contactEmail: user.contact_email,
      status: user.status,
    },
    ...tokensFor(user.id),
  };
}

export async function login(body, request) {
  const contactEmail = normalizeEmail(requiredString(body.contactEmail, "contactEmail"));
  const password = validatePassword(body.password);
  const user = await getUserByEmail(contactEmail);

  if (!user || user.status !== "active" || !verifyPassword(password, user.password_hash)) {
    await logActivity({
      action: "auth.login.failed",
      request,
    });
    throw new AuthError("UNAUTHORIZED", "Invalid email or password.", 401);
  }

  await logActivity({ userId: user.id, action: "auth.login", request });
  return {
    user: {
      id: user.id,
      organizationName: user.organization_name,
      contactEmail: user.contact_email,
      status: user.status,
    },
    ...tokensFor(user.id),
  };
}

export async function refresh(refreshToken, request) {
  let payload;
  try {
    payload = verifyToken(refreshToken, "refresh");
  } catch {
    await logActivity({ action: "auth.refresh.failed", request });
    throw new AuthError("UNAUTHORIZED", "Refresh token is invalid or expired.", 401);
  }

  const user = await getUserById(payload.sub);
  if (!user || user.status !== "active") {
    throw new AuthError("UNAUTHORIZED", "User account is not active.", 401);
  }

  await logActivity({ userId: user.id, action: "auth.refresh", request });
  return tokensFor(user.id);
}

export async function changePassword(userId, body, request) {
  const currentPassword = validatePassword(body.currentPassword, "currentPassword");
  const newPassword = validatePassword(body.newPassword, "newPassword");
  const user = await getUserById(userId);

  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    throw new AuthError("UNAUTHORIZED", "Current password is incorrect.", 401);
  }

  await updateUserPassword(userId, hashPassword(newPassword));
  await logActivity({ userId, action: "auth.password.changed", request });
  return { message: "Password changed successfully." };
}

export async function requestPasswordReset(body, request) {
  const contactEmail = normalizeEmail(requiredString(body.contactEmail, "contactEmail"));
  const user = await getUserByEmail(contactEmail);
  const response = {
    message: "If an account exists for that email, reset instructions have been issued.",
  };

  if (!user) {
    await logActivity({ action: "auth.password.reset.requested", request });
    return response;
  }

  const resetToken = issueResetToken(user.id);
  await logActivity({ userId: user.id, action: "auth.password.reset.requested", request });
  return {
    ...response,
    resetToken,
    developmentOnly: true,
  };
}

export async function confirmPasswordReset(body, request) {
  const resetToken = requiredString(body.resetToken, "resetToken");
  const newPassword = validatePassword(body.newPassword, "newPassword");
  let payload;
  try {
    payload = verifyToken(resetToken, "reset");
  } catch {
    throw new AuthError("UNAUTHORIZED", "Reset token is invalid or expired.", 401);
  }

  const user = await getUserById(payload.sub);
  if (!user || user.status !== "active") {
    throw new AuthError("UNAUTHORIZED", "User account is not active.", 401);
  }

  await updateUserPassword(user.id, hashPassword(newPassword));
  await logActivity({ userId: user.id, action: "auth.password.reset.completed", request });
  return { message: "Password reset successfully." };
}