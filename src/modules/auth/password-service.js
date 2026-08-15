import crypto from "node:crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_PREFIX = "scrypt";

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${SCRYPT_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [prefix, salt, hash] = String(storedHash).split("$");
  if (prefix !== SCRYPT_PREFIX || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, salt, KEY_LENGTH);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}