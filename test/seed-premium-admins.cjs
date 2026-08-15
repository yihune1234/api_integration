/**
 * Seed role-specific admins for the premium module E2E walkthrough.
 * DB-only (no HTTP) — avoids the HTTP hang seen when mixing http+pool in one process.
 */
const { seedAdmin } = require("../src/modules/admin/admin.service.js");
const { query, pool } = require("../src/db/connection.js");

async function main() {
  const seeded = [
    await seedAdmin({ email: "prem.super@test.com", password: "SuperPass123", role: "super_admin" }),
    await seedAdmin({ email: "prem.admin@test.com", password: "AdminPass123", role: "admin" }),
    await seedAdmin({ email: "prem.support@test.com", password: "SupportPass123", role: "support" }),
  ];
  console.log("Seeded:", seeded.map((a) => `${a.email}=${a.role}`).join(", "));
  const r = await query(
    "SELECT email, role FROM admins WHERE email IN ('prem.super@test.com','prem.admin@test.com','prem.support@test.com') ORDER BY role",
  );
  console.log("Verified in DB:");
  for (const row of r.rows) console.log("  -", row.email, "=", row.role);
  await pool.end();
}

main().catch((e) => {
  console.error("SEED FAIL:", e.message);
  process.exit(1);
});