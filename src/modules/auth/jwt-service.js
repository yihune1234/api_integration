import crypto from "node:crypto";
import { env } from "../../config/env.js";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signSegment(segment) {
  return crypto
    .createHmac("sha256", env.sessionSecret)
    .update(segment)
    .digest("base64url");
}

export function signToken(payload, expiresInSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  });
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${signSegment(unsigned)}`;
}

export function verifyToken(token, expectedType) {
  if (typeof token !== "string") {
    throw new Error("Token is missing");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token format is invalid");
  }

  const [header, body, signature] = parts;
  const expectedSignature = signSegment(`${header}.${body}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Token signature is invalid");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new Error("Token payload is invalid");
  }

  if (
    typeof payload.exp !== "number" ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Token has expired");
  }
  if (expectedType && payload.type !== expectedType) {
    throw new Error("Token type is invalid");
  }

  return payload;
}

export function issueAccessToken(userId) {
  return signToken(
    { sub: userId, type: "access" },
    env.accessTokenTtlSeconds,
  );
}

export function issueRefreshToken(userId) {
  return signToken(
    { sub: userId, type: "refresh" },
    env.refreshTokenTtlSeconds,
  );
}

export function issueResetToken(userId) {
  return signToken(
    { sub: userId, type: "reset" },
    env.resetTokenTtlSeconds,
  );
}

export function issueAdminAccessToken(adminId, role) {
  return signToken(
    { sub: adminId, type: "access", role },
    env.accessTokenTtlSeconds,
  );
}
