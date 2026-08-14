import app from "./app.js";
import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";
import { pool, verifyDatabaseConnection } from "./db/connection.js";

async function start() {
  try {
    await verifyDatabaseConnection();
    logger.info("Database connection established");

    const server = app.listen(env.port, () => {
      logger.info({ port: env.port }, "Server listening");
    });

    server.once("error", (error) => {
      logger.error({ err: error }, "Error listening on port");
      pool.end().finally(() => {
        process.exitCode = 1;
      });
    });
  } catch (error) {
    logger.error(
      { err: error, databaseUrl: env.databaseUrl.replace(/:\/\/[^@]*@/, "://***@") },
      "Unable to connect to the database. Confirm DATABASE_URL and that MySQL is running.",
    );
    process.exitCode = 1;
  }
}

start().finally(() => {
  if (process.exitCode) return pool.end();
});
