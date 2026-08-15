/**
 * E2E endpoint verification for EthioBridge API Platform.
 *
 * Runs actual HTTP requests against a running instance (http://127.0.0.1:5000)
 * and reports a table of Method | Endpoint | Auth | Test Case | Expected | Actual | Pass/Fail.
 *
 * Usage: node --env-file=.env test/e2e-endpoints.mjs
 */

const BASE = "http://127.0.0.1:5000/api";

let pass = 0;
let fail = 0;
const results = [];

function record({ method, endpoint, auth, testCase, expected, actual, ok }) {
  results.push({ method, endpoint, auth, testCase, expected, actual, ok });
  if (ok) pass++;
  else fail++;
}

async function request(method, path, { token = null, body = null, form = null, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== null) {
    h["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: payload });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

function ok(actual, expected) {
  if (expected === "any") return actual !== undefined;
  return String(actual) === String(expected);
}

// ── Helpers ──────────────────────────────────────────────────────────────

const unique = () => `org_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

// ── 1. Auth endpoints ────────────────────────────────────────────────────

async function testAuth() {
  const email = `${unique()}@example.com`;
  const password = "StrongPass123";

  // Register success
  let r = await request("POST", "/auth/register", {
    body: { organizationName: unique(), contactEmail: email, password },
  });
  record({
    method: "POST", endpoint: "/auth/register", auth: "none", testCase: "register success",
    expected: 201, actual: r.status, ok: r.status === 201 && r.json?.accessToken,
  });

  // Register duplicate email
  r = await request("POST", "/auth/register", {
    body: { organizationName: unique(), contactEmail: email, password },
  });
  record({
    method: "POST", endpoint: "/auth/register", auth: "none", testCase: "duplicate email",
    expected: 422, actual: r.status, ok: r.status === 422 && r.json?.errorCode === "VALIDATION_ERROR",
  });

  // Register malformed body
  r = await request("POST", "/auth/register", { body: { organizationName: "x" } });
  record({
    method: "POST", endpoint: "/auth/register", auth: "none", testCase: "malformed body",
    expected: 422, actual: r.status, ok: r.status === 422 && r.json?.errorCode === "VALIDATION_ERROR",
  });

  // Login success
  r = await request("POST", "/auth/login", {
    body: { contactEmail: email, password },
  });
  record({
    method: "POST", endpoint: "/auth/login", auth: "none", testCase: "login success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.accessToken,
  });
  const accessToken = r.json?.accessToken;
  const refreshToken = r.json?.refreshToken;

  // Login wrong password
  r = await request("POST", "/auth/login", {
    body: { contactEmail: email, password: "WrongPass123" },
  });
  record({
    method: "POST", endpoint: "/auth/login", auth: "none", testCase: "wrong password",
    expected: 401, actual: r.status, ok: r.status === 401 && r.json?.errorCode === "UNAUTHORIZED",
  });

  // Refresh
  r = await request("POST", "/auth/refresh", { body: { refreshToken } });
  record({
    method: "POST", endpoint: "/auth/refresh", auth: "none", testCase: "refresh success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.accessToken,
  });

  // Refresh invalid
  r = await request("POST", "/auth/refresh", { body: { refreshToken: "invalid.token.here" } });
  record({
    method: "POST", endpoint: "/auth/refresh", auth: "none", testCase: "invalid refresh token",
    expected: 401, actual: r.status, ok: r.status === 401,
  });

  // Change password (authenticated)
  r = await request("POST", "/auth/change-password", {
    token: accessToken,
    body: { currentPassword: password, newPassword: "NewStrongPass456" },
  });
  record({
    method: "POST", endpoint: "/auth/change-password", auth: "JWT", testCase: "change password success",
    expected: 200, actual: r.status, ok: r.status === 200,
  });

  // Change password without auth
  r = await request("POST", "/auth/change-password", {
    body: { currentPassword: password, newPassword: "NewStrongPass456" },
  });
  record({
    method: "POST", endpoint: "/auth/change-password", auth: "JWT", testCase: "no token",
    expected: 401, actual: r.status, ok: r.status === 401 && r.json?.errorCode === "UNAUTHORIZED",
  });

  // Reset password request
  r = await request("POST", "/auth/reset-password", { body: { contactEmail: email } });
  record({
    method: "POST", endpoint: "/auth/reset-password", auth: "none", testCase: "reset request success",
    expected: 200, actual: r.status, ok: r.status === 200,
  });

  // Reset password confirm with invalid token
  r = await request("POST", "/auth/reset-password/confirm", {
    body: { resetToken: "bad.token", newPassword: "AnotherPass789" },
  });
  record({
    method: "POST", endpoint: "/auth/reset-password/confirm", auth: "none", testCase: "invalid reset token",
    expected: 401, actual: r.status, ok: r.status === 401,
  });

  return { email, password: "NewStrongPass456", accessToken, refreshToken };
}

// ── 2. API Key endpoints ────────────────────────────────────────────────

async function testApiKeys(accessToken) {
  // Create key
  let r = await request("POST", "/api-keys", { token: accessToken, body: { plan: "free" } });
  record({
    method: "POST", endpoint: "/api-keys", auth: "JWT", testCase: "create key success",
    expected: 201, actual: r.status, ok: r.status === 201 && r.json?.key,
  });
  const rawKey = r.json?.key;
  const keyId = r.json?.apiKey?.id;

  // Create key without auth
  r = await request("POST", "/api-keys", { body: { plan: "free" } });
  record({
    method: "POST", endpoint: "/api-keys", auth: "JWT", testCase: "no token",
    expected: 401, actual: r.status, ok: r.status === 401 && r.json?.errorCode === "UNAUTHORIZED",
  });

  // List keys
  r = await request("GET", "/api-keys", { token: accessToken });
  record({
    method: "GET", endpoint: "/api-keys", auth: "JWT", testCase: "list keys success",
    expected: 200, actual: r.status, ok: r.status === 200 && Array.isArray(r.json?.apiKeys),
  });

  // Revoke key
  r = await request("POST", `/api-keys/${keyId}/revoke`, { token: accessToken });
  record({
    method: "POST", endpoint: "/api-keys/:id/revoke", auth: "JWT", testCase: "revoke key success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.apiKey?.status === "revoked",
  });

  // Regenerate key
  r = await request("POST", `/api-keys/${keyId}/regenerate`, { token: accessToken });
  record({
    method: "POST", endpoint: "/api-keys/:id/regenerate", auth: "JWT", testCase: "regenerate key success",
    expected: 201, actual: r.status, ok: r.status === 201 && r.json?.key,
  });

  // Revoke with invalid id
  r = await request("POST", "/api-keys/nonexistent/revoke", { token: accessToken });
  record({
    method: "POST", endpoint: "/api-keys/:id/revoke", auth: "JWT", testCase: "invalid id",
    expected: 404, actual: r.status, ok: r.status === 404,
  });

  return rawKey;
}

// ── 3. User endpoints ────────────────────────────────────────────────────

async function testUser(accessToken) {
  // Profile
  let r = await request("GET", "/user/profile", { token: accessToken });
  record({
    method: "GET", endpoint: "/user/profile", auth: "JWT", testCase: "profile success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.user,
  });

  // Profile without auth
  r = await request("GET", "/user/profile");
  record({
    method: "GET", endpoint: "/user/profile", auth: "JWT", testCase: "no token",
    expected: 401, actual: r.status, ok: r.status === 401,
  });

  // Usage
  r = await request("GET", "/user/usage", { token: accessToken });
  record({
    method: "GET", endpoint: "/user/usage", auth: "JWT", testCase: "usage success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.usage,
  });

  // Usage without auth
  r = await request("GET", "/user/usage");
  record({
    method: "GET", endpoint: "/user/usage", auth: "JWT", testCase: "no token",
    expected: 401, actual: r.status, ok: r.status === 401,
  });
}

// ── 4. Extraction endpoint ───────────────────────────────────────────────

function fileForm(filename, buffer, field = "file") {
  const fd = new FormData();
  fd.append(field, new Blob([buffer], { type: "application/octet-stream" }), filename);
  return fd;
}

async function testExtract() {
  const email = `${unique()}@example.com`;
  let r = await request("POST", "/auth/register", {
    body: { organizationName: unique(), contactEmail: email, password: "StrongPass123" },
  });
  const accessToken = r.json?.accessToken;
  r = await request("POST", "/api-keys", { token: accessToken, body: { plan: "free" } });
  const apiKey = r.json?.key;

  // JSON success
  r = await request("POST", "/v1/extract", {
    token: apiKey,
    form: fileForm("data.json", Buffer.from('[{"name":"Alice","age":30}]')),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "JSON success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.records?.length === 1 && r.json?.format === "json",
  });

  // XML success
  r = await request("POST", "/v1/extract", {
    token: apiKey,
    form: fileForm("data.xml", Buffer.from("<root><name>Alice</name></root>")),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "XML success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.format === "xml",
  });

  // CSV success
  r = await request("POST", "/v1/extract", {
    token: apiKey,
    form: fileForm("data.csv", Buffer.from("name,age\nAlice,30\nBob,25")),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "CSV success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.records?.length === 2 && r.json?.format === "csv",
  });

  // Excel (.xlsx) success — build a real workbook
  {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    ws.columns = [
      { header: "name", key: "name" },
      { header: "email", key: "email" },
    ];
    ws.addRow({ name: "Alice", email: "alice@example.com" });
    ws.addRow({ name: "Bob", email: "bob@example.com" });
    const xlsx = Buffer.from(await wb.xlsx.writeBuffer());
    r = await request("POST", "/v1/extract", {
      token: apiKey,
      form: fileForm("data.xlsx", xlsx),
    });
    record({
      method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "Excel success",
      expected: 200, actual: r.status, ok: r.status === 200 && r.json?.format === "xlsx" && r.json?.records?.length > 0,
    });
  }

  // Oversized file (> 10 MB → 413 FILE_TOO_LARGE)
  {
    const big = Buffer.alloc(11 * 1024 * 1024, "x");
    r = await request("POST", "/v1/extract", {
      token: apiKey,
      form: fileForm("data.csv", big),
    });
    record({
      method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "oversized file",
      expected: 413, actual: r.status, ok: r.status === 413 && r.json?.errorCode === "FILE_TOO_LARGE",
    });
  }

  // Unsupported format (.txt)
  r = await request("POST", "/v1/extract", {
    token: apiKey,
    form: fileForm("data.txt", Buffer.from("hello world")),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "unsupported format",
    expected: 415, actual: r.status, ok: r.status === 415 && r.json?.errorCode === "UNSUPPORTED_FORMAT",
  });

  // Empty file
  r = await request("POST", "/v1/extract", {
    token: apiKey,
    form: fileForm("data.csv", Buffer.alloc(0)),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "empty file",
    expected: 400, actual: r.status, ok: r.status === 400, // multer/detector path
  });

  // Missing API key
  r = await request("POST", "/v1/extract", {
    form: fileForm("data.csv", Buffer.from("name,age\nAlice,30")),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "missing API key",
    expected: 401, actual: r.status, ok: r.status === 401 && r.json?.errorCode === "MISSING_API_KEY",
  });

  // Invalid API key
  r = await request("POST", "/v1/extract", {
    token: "eb_live_invalidkey",
    form: fileForm("data.csv", Buffer.from("name,age\nAlice,30")),
  });
  record({
    method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "invalid API key",
    expected: 401, actual: r.status, ok: r.status === 401 && r.json?.errorCode === "INVALID_API_KEY",
  });

  // Expired API key — create key then revoke it (revoked keys are invalid)
  {
    const email2 = `${unique()}@example.com`;
    let r2 = await request("POST", "/auth/register", {
      body: { organizationName: unique(), contactEmail: email2, password: "StrongPass123" },
    });
    const tok2 = r2.json?.accessToken;
    r2 = await request("POST", "/api-keys", { token: tok2, body: { plan: "free" } });
    const key2 = r2.json?.key;
    const keyId2 = r2.json?.apiKey?.id;
    await request("POST", `/api-keys/${keyId2}/revoke`, { token: tok2 });
    r2 = await request("POST", "/v1/extract", {
      token: key2,
      form: fileForm("data.csv", Buffer.from("name,age\nAlice,30")),
    });
    record({
      method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "revoked (invalid) key",
      expected: 401, actual: r2.status, ok: r2.status === 401 && r2.json?.errorCode === "INVALID_API_KEY",
    });
  }

  // Rate limit exceeded — set remaining_requests to 0 via direct DB update
  {
    const { query } = await import("../src/db/connection.js");
    const { findApiKeyByHash } = await import("../src/db/models/api-keys.js");
    const crypto = await import("node:crypto");

    const email3 = `${unique()}@example.com`;
    let r3 = await request("POST", "/auth/register", {
      body: { organizationName: unique(), contactEmail: email3, password: "StrongPass123" },
    });
    const tok3 = r3.json?.accessToken;
    r3 = await request("POST", "/api-keys", { token: tok3, body: { plan: "free" } });
    const key3 = r3.json?.key;
    const keyHash = crypto.default.createHash("sha256").update(key3).digest("hex");
    const found = await findApiKeyByHash(keyHash);
    const apiKeyId = found.rows[0]?.id;
    // Pin reset_at to the future so MariaDB's ON UPDATE CURRENT_TIMESTAMP
    // doesn't reset remaining to max on the next request.
    const futureReset = new Date(Date.now() + 60 * 60 * 1000);
    await query(
      "UPDATE rate_limits SET remaining_requests = 0, reset_at = ? WHERE api_key_id = ?",
      [futureReset, apiKeyId],
    );
    r3 = await request("POST", "/v1/extract", {
      token: key3,
      form: fileForm("data.csv", Buffer.from("name,age\nAlice,30")),
    });
    record({
      method: "POST", endpoint: "/v1/extract", auth: "API Key", testCase: "rate limit exhausted",
      expected: 429, actual: r3.status, ok: r3.status === 429 && r3.json?.errorCode === "RATE_LIMIT_EXCEEDED",
    });
  }

  return apiKey;
}

// ── 5. Admin endpoints ──────────────────────────────────────────────────

async function seedAdmin() {
  const { hashPassword } = await import("../src/modules/auth/password-service.js");
  const { createAdmin, findAdminByEmail } = await import("../src/db/models/admins.js");
  const existing = await findAdminByEmail("admin@test.com");
  if (existing.rows[0]) return existing.rows[0];
  return createAdmin({
    email: "admin@test.com",
    passwordHash: hashPassword("AdminPass123"),
    role: "super_admin",
  }).then((r) => r.rows[0]);
}

async function testAdmin() {
  await seedAdmin();

  // Admin login
  let r = await request("POST", "/admin/login", {
    body: { email: "admin@test.com", password: "AdminPass123" },
  });
  record({
    method: "POST", endpoint: "/admin/login", auth: "none", testCase: "admin login success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.accessToken,
  });
  const adminToken = r.json?.accessToken;

  // Admin users
  r = await request("GET", "/admin/users", { token: adminToken });
  record({
    method: "GET", endpoint: "/admin/users", auth: "JWT", testCase: "list users success",
    expected: 200, actual: r.status, ok: r.status === 200 && Array.isArray(r.json?.users),
  });

  // Admin api-keys
  r = await request("GET", "/admin/api-keys", { token: adminToken });
  record({
    method: "GET", endpoint: "/admin/api-keys", auth: "JWT", testCase: "list api-keys success",
    expected: 200, actual: r.status, ok: r.status === 200 && Array.isArray(r.json?.apiKeys),
  });

  // Admin logs
  r = await request("GET", "/admin/logs", { token: adminToken });
  record({
    method: "GET", endpoint: "/admin/logs", auth: "JWT", testCase: "list logs success",
    expected: 200, actual: r.status, ok: r.status === 200 && Array.isArray(r.json?.logs),
  });

  // Admin plans
  r = await request("GET", "/admin/plans", { token: adminToken });
  record({
    method: "GET", endpoint: "/admin/plans", auth: "JWT", testCase: "list plans success",
    expected: 200, actual: r.status, ok: r.status === 200 && Array.isArray(r.json?.plans),
  });

  // Admin dashboard
  r = await request("GET", "/admin/dashboard", { token: adminToken });
  record({
    method: "GET", endpoint: "/admin/dashboard", auth: "JWT", testCase: "dashboard success",
    expected: 200, actual: r.status, ok: r.status === 200 && r.json?.stats,
  });

  // Admin without token
  r = await request("GET", "/admin/users");
  record({
    method: "GET", endpoint: "/admin/users", auth: "JWT", testCase: "no token",
    expected: 401, actual: r.status, ok: r.status === 401 && r.json?.errorCode === "UNAUTHORIZED",
  });

  // Admin with user JWT (not admin) — should be forbidden/unauthorized
  const email = `${unique()}@example.com`;
  r = await request("POST", "/auth/register", {
    body: { organizationName: unique(), contactEmail: email, password: "StrongPass123" },
  });
  const userToken = r.json?.accessToken;
  r = await request("GET", "/admin/users", { token: userToken });
  record({
    method: "GET", endpoint: "/admin/users", auth: "JWT", testCase: "user token on admin route",
    expected: 401, actual: r.status, ok: r.status === 401,
  });
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const { email, accessToken } = await testAuth();
  const rawKey = await testApiKeys(accessToken);
  await testUser(accessToken);
  await testExtract();
  await testAdmin();

  // Print results table
  console.log("\n=== E2E ENDPOINT TEST RESULTS ===");
  console.log(
    "Method".padEnd(7) + "Endpoint".padEnd(28) + "Auth".padEnd(9) + "Test Case".padEnd(28) + "Expected".padEnd(10) + "Actual".padEnd(8) + "Result"
  );
  for (const r of results) {
    console.log(
      r.method.padEnd(7) +
      (r.endpoint.length > 26 ? r.endpoint.slice(0, 25) + "…" : r.endpoint).padEnd(28) +
      r.auth.padEnd(9) +
      (r.testCase.length > 26 ? r.testCase.slice(0, 25) + "…" : r.testCase).padEnd(28) +
      String(r.expected).padEnd(10) +
      String(r.actual).padEnd(8) +
      (r.ok ? "PASS" : "FAIL")
    );
  }
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);

  // Close the local DB pool (used for direct helper queries) so the process can exit.
  await import("../src/db/connection.js").then((m) => m.pool.end());

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("E2E runner crashed:", err);
  process.exit(1);
});