/**
 * STEP 7 — Admin Portal End-to-End verification.
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

const uniq = () => `adminflow_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function main() {
  // Admin login
  const adm = await req("POST", "/admin/login", {
    body: { email: "admin@test.com", password: "AdminPass123" },
  });
  record({
    test: "0. Admin login",
    expected: "200 + accessToken + role",
    actual: `${adm.status} + ${adm.json?.accessToken ? "token" : "none"} + ${adm.json?.admin?.role}`,
    ok: adm.status === 200 && Boolean(adm.json?.accessToken) && adm.json?.admin?.role === "super_admin",
  });
  const adminToken = adm.json?.accessToken;

  // 1. Admin dashboard stats match real DB totals
  const dash = await req("GET", "/admin/dashboard", { token: adminToken });
  const { query } = await import("../src/db/connection.js");
  const dbUsers = await query("SELECT COUNT(*) AS total FROM users");
  const dbKeys = await query("SELECT COUNT(*) AS total FROM api_keys");
  const dbRequests = await query("SELECT COALESCE(SUM(request_count),0) AS total FROM api_usage");
  record({
    test: "1. Dashboard stats match DB",
    expected: `users=${dbUsers.rows[0].total} keys=${dbKeys.rows[0].total} requests=${dbRequests.rows[0].total}`,
    actual: `users=${dash.json?.stats?.users?.total} keys=${dash.json?.stats?.apiKeys?.total} requests=${dash.json?.stats?.requests?.total}`,
    ok: dash.status === 200 &&
      dash.json?.stats?.users?.total === Number(dbUsers.rows[0].total) &&
      dash.json?.stats?.apiKeys?.total === Number(dbKeys.rows[0].total) &&
      dash.json?.stats?.requests?.total === Number(dbRequests.rows[0].total),
  });

  // 2. Admin users page lists organizations
  const users = await req("GET", "/admin/users", { token: adminToken });
  record({
    test: "2. Admin users list",
    expected: "200 + users array",
    actual: `${users.status} + ${users.json?.users?.length ?? 0} users`,
    ok: users.status === 200 && Array.isArray(users.json?.users),
  });

  // 3. Admin API keys page shows keys; force-revoke works
  const keys = await req("GET", "/admin/api-keys", { token: adminToken });
  record({
    test: "3a. Admin API keys list",
    expected: "200 + apiKeys array",
    actual: `${keys.status} + ${keys.json?.apiKeys?.length ?? 0} keys`,
    ok: keys.status === 200 && Array.isArray(keys.json?.apiKeys),
  });
  const activeKey = keys.json?.apiKeys?.find((k) => k.status === "active");
  if (activeKey) {
    const revoke = await req("POST", `/admin/api-keys/${activeKey.id}/revoke`, { token: adminToken });
    record({
      test: "3b. Admin force-revoke key",
      expected: "200 + message",
      actual: `${revoke.status} + ${revoke.json?.message}`,
      ok: revoke.status === 200 && Boolean(revoke.json?.message),
    });
  } else {
    record({ test: "3b. Admin force-revoke key", expected: "active key found", actual: "none found", ok: false });
  }

  // 4. Admin logs page shows real activity_logs entries; filtering works
  const logs = await req("GET", "/admin/logs", { token: adminToken });
  record({
    test: "4a. Admin logs list",
    expected: "200 + logs array",
    actual: `${logs.status} + ${logs.json?.logs?.length ?? 0} logs`,
    ok: logs.status === 200 && Array.isArray(logs.json?.logs) && logs.json?.logs?.length > 0,
  });
  const filteredLogs = await req("GET", "/admin/logs?action=auth.login", { token: adminToken });
  record({
    test: "4b. Admin logs filter by action",
    expected: "200 + filtered logs",
    actual: `${filteredLogs.status} + ${filteredLogs.json?.logs?.length ?? 0} logs`,
    ok: filteredLogs.status === 200 && filteredLogs.json?.logs?.every((l) => l.action === "auth.login"),
  });

  // 5. Admin plans page reflects real enforced limits; lowering a limit is enforced
  const plans = await req("GET", "/admin/plans", { token: adminToken });
  record({
    test: "5a. Admin plans list",
    expected: "200 + plans array with free=100",
    actual: `${plans.status} + ${plans.json?.plans?.length ?? 0} plans`,
    ok: plans.status === 200 && Array.isArray(plans.json?.plans) && plans.json?.plans?.some((p) => p.name === "free" && p.max_requests === 100),
  });
  const freePlan = plans.json?.plans?.find((p) => p.name === "free");
  if (freePlan) {
    // Lower free plan to 2 requests/day
    const update = await req("PUT", `/admin/plans/${freePlan.id}`, {
      token: adminToken,
      body: { maxRequests: 2 },
    });
    record({
      test: "5b. Lower free plan limit to 2",
      expected: "200 + plans updated",
      actual: `${update.status} + ${update.json?.message}`,
      ok: update.status === 200 && update.json?.plans?.some((p) => p.name === "free" && p.max_requests === 2),
    });

    // Create a fresh user + key, exhaust 2 requests, 3rd should be 429
    const email = `${uniq()}@example.com`;
    const reg = await req("POST", "/auth/register", {
      body: { organizationName: uniq(), contactEmail: email, password: "StrongPass123" },
    });
    const keyCreate = await req("POST", "/api-keys", { token: reg.json?.accessToken, body: { plan: "free" } });
    const rawKey = keyCreate.json?.key;
    const fd = new FormData();
    fd.append("file", new Blob([Buffer.from("name,age\nAlice,30")], { type: "text/csv" }), "data.csv");
    const r1 = await req("POST", "/v1/extract", { token: rawKey, form: fd });
    const r2 = await req("POST", "/v1/extract", { token: rawKey, form: fd });
    const r3 = await req("POST", "/v1/extract", { token: rawKey, form: fd });
    record({
      test: "5c. New limit enforced (2/day → 3rd = 429)",
      expected: "200, 200, 429",
      actual: `${r1.status}, ${r2.status}, ${r3.status}`,
      ok: r1.status === 200 && r2.status === 200 && r3.status === 429 && r3.json?.errorCode === "RATE_LIMIT_EXCEEDED",
    });

    // Restore free plan to 100
    await req("PUT", `/admin/plans/${freePlan.id}`, {
      token: adminToken,
      body: { maxRequests: 100 },
    });
  }

  console.log("\n=== STEP 7: ADMIN PORTAL E2E RESULTS ===");
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
