/**
 * Contract ambiguity verification — runs real HTTP requests against the backend
 * to confirm the exact response shapes documented in Section 10.
 */
const BASE = "http://127.0.0.1:5000/api";

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
  return {
    status: res.status,
    json,
    rateLimitRemaining: res.headers.get("x-ratelimit-remaining"),
    rateLimitReset: res.headers.get("x-ratelimit-reset"),
    setCookie: res.headers.get("set-cookie"),
  };
}

const uniq = () => `contract_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function main() {
  const report = [];

  // 1. Register (capture tokens)
  const email = `${uniq()}@example.com`;
  const reg = await req("POST", "/auth/register", {
    body: { organizationName: uniq(), contactEmail: email, password: "StrongPass123" },
  });
  report.push({
    test: "1. register response shape",
    status: reg.status,
    keys: Object.keys(reg.json ?? {}),
    userKeys: Object.keys(reg.json?.user ?? {}),
    hasRefreshInBody: Boolean(reg.json?.refreshToken),
    setCookie: reg.setCookie,
  });

  const accessToken = reg.json?.accessToken;
  const refreshToken = reg.json?.refreshToken;

  // 2. Refresh (confirm body-delivered refresh token works)
  const ref = await req("POST", "/auth/refresh", { body: { refreshToken } });
  report.push({
    test: "2. refresh with body token",
    status: ref.status,
    keys: Object.keys(ref.json ?? {}),
    hasNewAccess: Boolean(ref.json?.accessToken),
    setCookie: ref.setCookie,
  });

  // 3. Validation error shape (missing password on register)
  const bad = await req("POST", "/auth/register", {
    body: { organizationName: uniq(), contactEmail: `${uniq()}@example.com` },
  });
  report.push({
    test: "3. VALIDATION_ERROR shape (missing password)",
    status: bad.status,
    errorCode: bad.json?.errorCode,
    keys: Object.keys(bad.json ?? {}),
    hasFieldsObj: bad.json?.fields !== undefined,
  });

  // 4. Create API key with plan
  const key = await req("POST", "/api-keys", {
    token: accessToken,
    body: { plan: "free" },
  });
  report.push({
    test: "4. create API key response",
    status: key.status,
    keys: Object.keys(key.json ?? {}),
    apiKeyKeys: Object.keys(key.json?.apiKey ?? {}),
    hasRawKey: Boolean(key.json?.key),
  });
  const rawKey = key.json?.key;

  // 5. Key-check endpoint (rate limit headers?)
  const kc = await req("GET", "/v1/key-check", { token: rawKey });
  report.push({
    test: "5. key-check (rate-limit headers?)",
    status: kc.status,
    json: kc.json,
    xRateLimitRemaining: kc.rateLimitRemaining,
    xRateLimitReset: kc.rateLimitReset,
  });

  // 6. Extraction success response shape (CSV)
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("name,age\nAlice,30\nBob,25")], { type: "text/csv" }), "data.csv");
  const ex = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  report.push({
    test: "6. /v1/extract success shape",
    status: ex.status,
    keys: Object.keys(ex.json ?? {}),
    formatValue: ex.json?.format,
    recordCount: ex.json?.recordCount,
    hasDataWrapper: ex.json?.data !== undefined,
    hasMetadata: ex.json?.metadata !== undefined,
    xRateLimitRemaining: ex.rateLimitRemaining,
    xRateLimitReset: ex.rateLimitReset,
  });

  // 7. User usage shape
  const usage = await req("GET", "/user/usage", { token: accessToken });
  report.push({
    test: "7. /user/usage shape",
    status: usage.status,
    usageKeys: Object.keys(usage.json?.usage ?? {}),
    dailyType: Array.isArray(usage.json?.usage?.daily) ? "array" : typeof usage.json?.usage?.daily,
    monthlyType: Array.isArray(usage.json?.usage?.monthly) ? "array" : typeof usage.json?.usage?.monthly,
  });

  // 8. User profile shape
  const prof = await req("GET", "/user/profile", { token: accessToken });
  report.push({
    test: "8. /user/profile shape",
    status: prof.status,
    userKeys: Object.keys(prof.json?.user ?? {}),
  });

  // 9. Admin login + admin users/logs/plans/dashboard shapes
  const adm = await req("POST", "/admin/login", {
    body: { email: "admin@test.com", password: "AdminPass123" },
  });
  report.push({
    test: "9. admin login shape",
    status: adm.status,
    keys: Object.keys(adm.json ?? {}),
    adminKeys: Object.keys(adm.json?.admin ?? {}),
  });
  const adminToken = adm.json?.accessToken;
  if (adminToken) {
    const users = await req("GET", "/admin/users", { token: adminToken });
    report.push({
      test: "10. /admin/users row shape",
      status: users.status,
      topKeys: Object.keys(users.json ?? {}),
      rowKeys: users.json?.users?.[0] ? Object.keys(users.json.users[0]) : [],
    });

    const logs = await req("GET", "/admin/logs", { token: adminToken });
    report.push({
      test: "11. /admin/logs row shape + pagination params",
      status: logs.status,
      topKeys: Object.keys(logs.json ?? {}),
      rowKeys: logs.json?.logs?.[0] ? Object.keys(logs.json.logs[0]) : [],
    });

    const plans = await req("GET", "/admin/plans", { token: adminToken });
    report.push({
      test: "12. /admin/plans row shape",
      status: plans.status,
      rowKeys: plans.json?.plans?.[0] ? Object.keys(plans.json.plans[0]) : [],
    });

    const dash = await req("GET", "/admin/dashboard", { token: adminToken });
    report.push({
      test: "13. /admin/dashboard shape",
      status: dash.status,
      statsKeys: Object.keys(dash.json?.stats ?? {}),
      stats: dash.json?.stats,
    });
  }

  // 14. Password reset endpoints
  const resetReq = await req("POST", "/auth/reset-password", { body: { contactEmail: email } });
  report.push({
    test: "14. reset-password request (endpoint 1 of 2)",
    status: resetReq.status,
    keys: Object.keys(resetReq.json ?? {}),
    hasResetToken: Boolean(resetReq.json?.resetToken),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});