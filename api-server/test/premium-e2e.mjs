/**
 * Premium module E2E verification (backend) â€” self-contained, no DB imports.
 * Warms up the server first, uses AbortSignal.timeout on every request.
 */
const BASE = "http://127.0.0.1:5000/api";
const T = 20000;

let pass = 0;
let fail = 0;
const results = [];

function record({ test, expected, actual, ok }) {
  results.push({ test, expected, actual, ok });
  if (ok) pass++;
  else fail++;
}

async function req(method, path, { token = null, body = null } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== null) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: payload,
    signal: AbortSignal.timeout(T),
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const uniq = () => `premium_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function main() {
  // Warmup: hit an endpoint that touches the DB so the pool is ready.
  await req("GET", "/healthz");

  // Admin accounts (created directly in DB via the existing admin service path)
  const { query: db } = await import("../src/db/connection.js");
  const { hashPassword } = await import("../src/modules/auth/password-service.js");
  const { createAdmin } = await import("../src/db/models/admins.js");

  const superEmail = `${uniq()}@super.com`;
  await createAdmin({ email: superEmail, passwordHash: hashPassword("SuperPass123"), role: "super_admin" });
  const adminEmail = `${uniq()}@admin.com`;
  await createAdmin({ email: adminEmail, passwordHash: hashPassword("AdminPass123"), role: "admin" });
  const supportEmail = `${uniq()}@support.com`;
  await createAdmin({ email: supportEmail, passwordHash: hashPassword("SupportPass123"), role: "support" });

  const supLogin = await req("POST", "/admin/login", { body: { email: superEmail, password: "SuperPass123" } });
  const adminLogin = await req("POST", "/admin/login", { body: { email: adminEmail, password: "AdminPass123" } });
  const supportLogin = await req("POST", "/admin/login", { body: { email: supportEmail, password: "SupportPass123" } });

  record({
    test: "0a. super_admin can login",
    expected: "200 + super_admin",
    actual: `${supLogin.status} + ${supLogin.json?.admin?.role}`,
    ok: supLogin.status === 200 && supLogin.json?.admin?.role === "super_admin",
  });
  record({
    test: "0b. admin role can login",
    expected: "200 + admin",
    actual: `${adminLogin.status} + ${adminLogin.json?.admin?.role}`,
    ok: adminLogin.status === 200 && adminLogin.json?.admin?.role === "admin",
  });
  record({
    test: "0c. support role can login",
    expected: "200 + support",
    actual: `${supportLogin.status} + ${supportLogin.json?.admin?.role}`,
    ok: supportLogin.status === 200 && supportLogin.json?.admin?.role === "support",
  });

  const email = `${uniq()}@example.com`;
  const reg = await req("POST", "/auth/register", {
    body: { organizationName: uniq(), contactEmail: email, password: "StrongPass123" },
  });
  const userToken = reg.json?.accessToken;

  const keyCreate = await req("POST", "/api-keys", { token: userToken, body: { plan: "free" } });
  const keyId = keyCreate.json?.apiKey?.id;
  record({
    test: "1a. User starts on free plan",
    expected: "201 + plan=free",
    actual: `${keyCreate.status} + plan=${keyCreate.json?.apiKey?.plan}`,
    ok: keyCreate.status === 201 && keyCreate.json?.apiKey?.plan === "free",
  });

  const req1 = await req("POST", "/premium/request", {
    token: userToken,
    body: { requestedPlan: "business", paymentReference: `MOCK-TX-${Date.now()}` },
  });
  record({
    test: "1b. Submit premium request (mock payment)",
    expected: "201 + mock_confirmed + pending",
    actual: `${req1.status} + ${req1.json?.payment_status} + ${req1.json?.approval_status}`,
    ok: req1.status === 201 && req1.json?.payment_status === "mock_confirmed" && req1.json?.approval_status === "pending",
  });
  const requestId = req1.json?.id;

  const dup = await req("POST", "/premium/request", {
    token: userToken,
    body: { requestedPlan: "enterprise", paymentReference: "MOCK-TX-9999" },
  });
  record({
    test: "2. Duplicate pending â†’ PREMIUM_REQUEST_PENDING 409",
    expected: "409 PREMIUM_REQUEST_PENDING",
    actual: `${dup.status} + ${dup.json?.errorCode}`,
    ok: dup.status === 409 && dup.json?.errorCode === "PREMIUM_REQUEST_PENDING",
  });

  const list = await req("GET", "/admin/premium-requests", { token: adminLogin.json?.accessToken });
  record({
    test: "3. Admin lists pending requests",
    expected: "200 + contains request",
    actual: `${list.status} + ${list.json?.requests?.length ?? 0} pending`,
    ok: list.status === 200 && list.json?.requests?.some((r) => r.id === requestId),
  });

  const approve = await req("POST", `/admin/premium-requests/${requestId}/approve`, { token: adminLogin.json?.accessToken });
  record({
    test: "4a. Approve request",
    expected: "200 + approved",
    actual: `${approve.status} + ${approve.json?.approval_status}`,
    ok: approve.status === 200 && approve.json?.approval_status === "approved",
  });

  const keyRow = (await db("SELECT plan FROM api_keys WHERE id = ?", [keyId])).rows[0];
  const rlRow = (await db("SELECT max_requests FROM rate_limits WHERE api_key_id = ?", [keyId])).rows[0];
  record({
    test: "4b. Plan changed on api_keys + rate_limits",
    expected: "plan=business, max_requests=10000",
    actual: `plan=${keyRow?.plan}, max=${rlRow?.max_requests}`,
    ok: keyRow?.plan === "business" && rlRow?.max_requests === 10000,
  });

  const req2 = await req("POST", "/premium/request", {
    token: userToken,
    body: { requestedPlan: "enterprise", paymentReference: `MOCK-TX-${Date.now()}` },
  });
  const req2Id = req2.json?.id;
  const reject = await req("POST", `/admin/premium-requests/${req2Id}/reject`, {
    token: adminLogin.json?.accessToken,
    body: { rejectionReason: "Not approved" },
  });
  record({
    test: "5a. Reject second request",
    expected: "200 + rejected",
    actual: `${reject.status} + ${reject.json?.approval_status}`,
    ok: reject.status === 200 && reject.json?.approval_status === "rejected",
  });

  const supportApprove = await req("POST", `/admin/premium-requests/${req2Id}/approve`, { token: supportLogin.json?.accessToken });
  record({
    test: "6. support admin blocked â†’ FORBIDDEN_ROLE 403",
    expected: "403 FORBIDDEN_ROLE",
    actual: `${supportApprove.status} + ${supportApprove.json?.errorCode}`,
    ok: supportApprove.status === 403 && supportApprove.json?.errorCode === "FORBIDDEN_ROLE",
  });

  const status = await req("GET", "/premium/status", { token: userToken });
  record({
    test: "7. User premium status lists requests",
    expected: "200 + 2 requests",
    actual: `${status.status} + ${status.json?.requests?.length ?? 0} requests`,
    ok: status.status === 200 && status.json?.requests?.length === 2,
  });

  const missing = await req("POST", "/admin/premium-requests/does-not-exist/approve", { token: adminLogin.json?.accessToken });
  record({
    test: "8. Approve non-existent â†’ PREMIUM_REQUEST_NOT_FOUND 404",
    expected: "404 PREMIUM_REQUEST_NOT_FOUND",
    actual: `${missing.status} + ${missing.json?.errorCode}`,
    ok: missing.status === 404 && missing.json?.errorCode === "PREMIUM_REQUEST_NOT_FOUND",
  });

  console.log("\n=== STEP 2: PREMIUM MODULE BACKEND E2E RESULTS ===");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.test} | expected: ${r.expected} | actual: ${r.actual}`);
  }
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
