import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./connection.js";
import { logger } from "../lib/logger.js";

const migrationsDir = path.dirname(fileURLToPath(import.meta.url)) + "/migrations";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [appliedRows] = await pool.query(
    "SELECT filename FROM schema_migrations ORDER BY filename",
  );
  const applied = new Set(appliedRows.map((row) => row.filename));
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    if (applied.has(filename)) continue;

    const sql = await readFile(path.join(migrationsDir, filename), "utf8");
    const client = await pool.getConnection();
    try {
      await client.beginTransaction();
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [filename],
      );
      await client.commit();
      logger.info({ filename }, "Migration applied");
    } catch (error) {
      await client.rollback();
      throw error;
    } finally {
      client.release();
    }
  }

  logger.info({ count: files.length }, "Database migrations complete");
}

migrate()
  .catch((error) => {
    logger.error({ err: error }, "Database migration failed");
    process.exitCode = 1;
  })
  .finally(() => pool.end());
