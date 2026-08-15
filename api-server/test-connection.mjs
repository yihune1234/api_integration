import { pool, verifyDatabaseConnection, query } from "./src/db/connection.js";
import { seedAdmin } from "./src/modules/admin/admin.service.js";
import { loginAdmin } from "./src/modules/admin/admin.service.js";

async function main() {
  console.log("Testing database connection...");
  
  try {
    await verifyDatabaseConnection();
    console.log("✓ Database connection successful!");
  } catch (err) {
    console.error("✗ Database connection failed:", err.message);
    process.exit(1);
  }

  // Test query
  try {
    const result = await query("SELECT 1 as test");
    console.log("✓ Test query successful:", result.rows);
  } catch (err) {
    console.error("✗ Test query failed:", err.message);
  }

  // Seed admin
  console.log("\nSeeding admin user...");
  try {
    const admin = await seedAdmin({
      email: "admin@example.com",
      password: "AdminPass123",
      role: "super_admin"
    });
    console.log("✓ Admin created:", admin);
  } catch (err) {
    console.error("✗ Admin creation failed:", err.message);
  }

  // Test admin login
  console.log("\nTesting admin login...");
  try {
    const loginResult = await loginAdmin({
      email: "admin@example.com",
      password: "AdminPass123"
    }, {});
    console.log("✓ Login successful!");
    console.log("  Admin:", loginResult.admin);
    console.log("  Token:", loginResult.accessToken.substring(0, 50) + "...");
  } catch (err) {
    console.error("✗ Login failed:", err.message);
  }

  await pool.end();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});