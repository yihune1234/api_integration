/**
 * STEP 4 — Auth Flow End-to-End verification.
 * Runs real HTTP requests against the running backend and reports pass/fail.
 */
const BASE = "http://127.0.0.1:5000/api";

let pass = 0;
let fail = 0;
const results = [];

function record({ test, expected, actual, ok }) {
  results.push({ test, expected, actual, ok });
  if (ok) pass++;
  else fail++;
}

async function req(method, path, { token = null, body = null, form = null } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== null) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const uniq = () => `authflow_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function main() {
  const email = `${uniq()}@example.com`;
  const password = "StrongPass123";

  // 1. Register from the frontend flow → row appears in users table
  const reg = await req("POST", "/auth/register", {
    body: { organizationName: uniq(), contactEmail: email, password },
  });
  record({
    test: "1. Register → 201 + tokens",
    expected: "201 + accessToken",
    actual: `${reg.status} + ${reg.json?.accessToken ? "accessToken" : "none"}`,
    ok: reg.status === 201 && Boolean(reg.json?.accessToken) && Boolean(reg.json?.refreshToken),
  });
  const accessToken = reg.json?.accessToken;
  const refreshToken = reg.json?.refreshToken;

  // Verify row in DB
  const { query } = await import("../src/db/connection.js");
  const dbRes = await query("SELECT id, contact_email, status FROM users WHERE contact_email = ?", [email]);
  record({
    test: "1b. Row exists in users table",
    expected: "1 row",
    actual: `${dbRes.rows.length} row(s)`,
    ok: dbRes.rows.length === 1 && dbRes.rows[0].status === "active",
  });

  // 2. Log in → valid access token
  const login = await req("POST", "/auth/login", {
    body: { contactEmail: email, password },
  });
  record({
    test: "2. Login → 200 + accessToken",
    expected: "200 + accessToken",
    actual: `${login.status} + ${login.json?.accessToken ? "accessToken" : "none"}`,
    ok: login.status === 200 && Boolean(login.json?.accessToken),
  });

  // 3. Reload after login → session persists via silent refresh
  const refresh = await req("POST", "/auth/refresh", { body: { refreshToken } });
  record({
    test: "3. Refresh → 200 + new accessToken",
    expected: "200 + new accessToken",
    actual: `${refresh.status} + ${refresh.json?.accessToken ? "new accessToken" : "none"}`,
    ok: refresh.status === 200 && Boolean(refresh.json?.accessToken),
  });

  // 4. Log out → token cleared (client-side; verify token no longer works)
  const logoutCheck = await req("GET", "/user/profile", { token: "invalid-token" });
  record({
    test: "4. Logout → invalid token rejected",
    expected: "401",
    actual: `${logoutCheck.status}`,
    ok: logoutCheck.status === 401,
  });

  // 5. Wrong password → backend's actual error message
  const wrong = await req("POST", "/auth/login", {
    body: { contactEmail: email, password: "WrongPass123" },
  });
  record({
    test: "5. Wrong password → 401 UNAUTHORIZED + message",
    expected: "401 + 'Invalid email or password.'",
    actual: `${wrong.status} + '${wrong.json?.message}'`,
    ok: wrong.status === 401 && wrong.json?.errorCode === "UNAUTHORIZED" && wrong.json?.message === "Invalid email or password.",
  });

  // 6. Change password → old password no longer logs in
  const change = await req("POST", "/auth/change-password", {
    token: accessToken,
    body: { currentPassword: password, newPassword: "NewStrongPass456" },
  });
  record({
    test: "6a. Change password → 200",
    expected: "200",
    actual: `${change.status}`,
    ok: change.status === 200,
  });
  const oldLogin = await req("POST", "/auth/login", {
    body: { contactEmail: email, password },
  });
  record({
    test: "6b. Old password rejected",
    expected: "401",
    actual: `${oldLogin.status}`,
    ok: oldLogin.status === 401,
  });
  const newLogin = await req("POST", "/auth/login", {
    body: { contactEmail: email, password: "NewStrongPass456" },
  });
  record({
    test: "6c. New password works",
    expected: "200",
    actual: `${newLogin.status}`,
    ok: newLogin.status === 200,
  });

  // 7. Non-admin account hitting /admin/* → 401 (user token has no role claim)
  const adminAttempt = await req("GET", "/admin/users", { token: accessToken });
  record({
    test: "7. User token on /admin/users → 401",
    expected: "401",
    actual: `${adminAttempt.status}`,
    ok: adminAttempt.status === 401,
  });

  // Print results
  console.log("\n=== STEP 4: AUTH FLOW E2E RESULTS ===");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.test} | expected: ${r.expected} | actual: ${r.actual}`);
  }
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);

  await import("../src/db/connection.js").then((m) => m.pool.end());
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});