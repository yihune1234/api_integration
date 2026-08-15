import { query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createAdmin({
  email,
  passwordHash,
  role = "support",
  permissions = null,
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO admins (id, email, password_hash, role, permissions)
     VALUES (?, ?, ?, ?, ?)`,
    [id, email, passwordHash, role, permissions],
  );
  return query("SELECT id, email, role, permissions, created_at FROM admins WHERE id = ?", [id]);
}

export function findAdminByEmail(email) {
  return query("SELECT * FROM admins WHERE email = ?", [email]);
}
