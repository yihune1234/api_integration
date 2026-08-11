import { query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createActivityLog({
  userId = null,
  action,
  ipAddress = null,
  endpoint = null,
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO activity_logs (id, user_id, action, ip_address, endpoint)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, action, ipAddress, endpoint],
  );
  return query("SELECT * FROM activity_logs WHERE id = ?", [id]);
}

export function listActivityLogs(limit = 100) {
  return query(
    `SELECT * FROM activity_logs
     ORDER BY timestamp DESC
     LIMIT ?`,
    [limit],
  );
}
