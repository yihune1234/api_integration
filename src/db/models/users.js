import { query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createUser({
  organizationName,
  contactEmail,
  passwordHash,
  status = "active",
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO users
      (id, organization_name, contact_email, password_hash, status)
     VALUES (?, ?, ?, ?, ?)`,
    [id, organizationName, contactEmail, passwordHash, status],
  );
  return findUserById(id);
}

export function findUserById(id) {
  return query("SELECT * FROM users WHERE id = ?", [id]);
}

export function findUserByEmail(contactEmail) {
  return query("SELECT * FROM users WHERE contact_email = ?", [contactEmail]);
}

export async function updateUserPassword(id, passwordHash) {
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
  return query("SELECT id, contact_email FROM users WHERE id = ?", [id]);
}
