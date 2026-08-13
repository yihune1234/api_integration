/**
 * Debug: verify plan-limit propagation to newly created keys.
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
  return { status: res.status, json };
}

const uniq = () => `dbg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function main() {
  const { query } = await import("../src/db/connection.js");

  // Admin login
  const adm = await req("POST", "/admin/login", { body: { email: "admin@test.com", password: "AdminPass123" } });
  const adminToken = adm.json?.accessToken;

  // Read free plan id + max
  const plans = await req("GET", "/admin/plans", { token: adminToken });
  const freePlan = plans.json?.plans?.find((p) => p.name === "free");
  console.log("Free plan before:", JSON.stringify(freePlan));

  // Lower to 2
  const upd = await req("PUT", `/admin/plans/${freePlan.id}`, { token: adminToken, body: { maxRequests: 2 } });
  console.log("Update status:", upd.status, upd.json?.message);

  // Check plans table
  const planDb = await query("SELECT id, name, max_requests FROM plans WHERE name = 'free'");
  console.log("Plans table free:", JSON.stringify(planDb.rows[0]));

  // Create user + key
  const email = `${uniq()}@example.com`;
  const reg = await req("POST", "/auth/register", { body: { organizationName: uniq(), contactEmail: email, password: "StrongPass123" } });
  const keyCreate = await req("POST", "/api-keys", { token: reg.json?.accessToken, body: { plan: "free" } });
  console.log("Key create:", keyCreate.status, keyCreate.json?.apiKey?.plan);
  const rawKey = keyCreate.json?.key;
  const keyId = keyCreate.json?.apiKey?.id;

  // Check the new key's rate_limits row
  const rl = await query("SELECT max_requests, remaining_requests, reset_at FROM rate_limits WHERE api_key_id = ?", [keyId]);
  console.log("New key rate_limit:", JSON.stringify(rl.rows[0]));

  // 3 requests
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("name,age\nAlice,30")], { type: "text/csv" }), "data.csv");
  const r1 = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  const r2 = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  const r3 = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  console.log("Requests:", r1.status, r2.status, r3.status);

  // Check rate_limit after requests
  const rl2 = await query("SELECT max_requests, remaining_requests, reset_at FROM rate_limits WHERE api_key_id = ?", [keyId]);
  console.log("After 3 requests:", JSON.stringify(rl2.rows[0]));

  // Restore free plan to 100
  await req("PUT", `/admin/plans/${freePlan.id}`, { token: adminToken, body: { maxRequests: 100 } });
  const plansDb2 = await query("SELECT max_requests FROM plans WHERE name = 'free'");
  console.log("Free plan restored to:", plansDb2.rows[0]?.max_requests);

  await import("../src/db/connection.js").then((m) => m.pool.end());
}

main().catch((err) => { console.error("FAILED:", err); process.exit(1); });
