const required = ["DATABASE_URL", "SESSION_SECRET"];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`${name} environment variable is required but was not provided.`);
  }
}

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  port,
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 7 * 24 * 60 * 60,
  resetTokenTtlSeconds: 15 * 60,
};