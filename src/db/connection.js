import mysql from "mysql2/promise";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  uri: env.databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Check connectivity before the HTTP server begins accepting requests.
 */
export async function verifyDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

export async function query(text, values = []) {
  const [rows] = await pool.query(text, values);
  return {
    rows: Array.isArray(rows) ? rows : [],
    rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows,
  };
}
