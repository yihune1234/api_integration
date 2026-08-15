/**
 * STEP 5 — API Key Management End-to-End verification.
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

const uniq = () => `keyflow_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function main() {
  const email = `${uniq()}@example.com`;
  const reg = await req("POST", "/auth/register", {
    body: { organizationName: uniq(), contactEmail: email, password: "StrongPass123" },
  });
  const accessToken = reg.json?.accessToken;

  // 1. Generate a key → raw key modal displays it; confirm only hash stored
  const create = await req("POST", "/api-keys", {
    token: accessToken,
    body: { plan: "free" },
  });
  record({
    test: "1a. Create key → 201 + raw key + metadata",
    expected: "201 + key + apiKey",
    actual: `${create.status} + ${create.json?.key ? "key" : "none"} + ${create.json?.apiKey ? "apiKey" : "none"}`,
    ok: create.status === 201 && Boolean(create.json?.key) && Boolean(create.json?.apiKey?.id),
  });
  const rawKey = create.json?.key;
  const keyId = create.json?.apiKey?.id;

  // Verify DB stores only hash, never raw
  const { query } = await import("../src/db/connection.js");
  const dbRes = await query("SELECT key_hash, key_prefix FROM api_keys WHERE id = ?", [keyId]);
  const row = dbRes.rows[0];
  record({
    test: "1b. DB stores hash, not raw key",
    expected: "key_hash != rawKey, key_prefix matches",
    actual: `hash=${row?.key_hash?.slice(0, 8)}… prefix=${row?.key_prefix}`,
    ok: row && row.key_hash !== rawKey && row.key_prefix === rawKey.slice(0, 12),
  });

  // 2. Reload → raw key gone from UI (client-side; verify list doesn't include raw)
  const list = await req("GET", "/api-keys", { token: accessToken });
  record({
    test: "2. List keys → no raw key in response",
    expected: "apiKeys[] without raw key",
    actual: `${list.json?.apiKeys?.length ?? 0} key(s), raw=${list.json?.apiKeys?.some((k) => k.key === rawKey) ? "present" : "absent"}`,
    ok: list.status === 200 && !list.json?.apiKeys?.some((k) => k.key === rawKey),
  });

  // 3. Use raw key for real POST /v1/extract → succeeds
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("name,age\nAlice,30\nBob,25")], { type: "text/csv" }), "data.csv");
  const extract = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  record({
    test: "3. Raw key works on /v1/extract",
    expected: "200 + records",
    actual: `${extract.status} + ${extract.json?.recordCount ?? 0} records`,
    ok: extract.status === 200 && extract.json?.recordCount === 2,
  });

  // 4. Revoke the key → repeat extract returns INVALID_API_KEY
  const revoke = await req("POST", `/api-keys/${keyId}/revoke`, { token: accessToken });
  record({
    test: "4a. Revoke key → 200 + status revoked",
    expected: "200 + revoked",
    actual: `${revoke.status} + ${revoke.json?.apiKey?.status}`,
    ok: revoke.status === 200 && revoke.json?.apiKey?.status === "revoked",
  });
  const extractAfterRevoke = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  record({
    test: "4b. Revoked key rejected on /v1/extract",
    expected: "401 INVALID_API_KEY",
    actual: `${extractAfterRevoke.status} + ${extractAfterRevoke.json?.errorCode}`,
    ok: extractAfterRevoke.status === 401 && extractAfterRevoke.json?.errorCode === "INVALID_API_KEY",
  });

  // 5. Regenerate → old key stops working, new raw key shown once
  const regen = await req("POST", `/api-keys/${keyId}/regenerate`, { token: accessToken });
  record({
    test: "5a. Regenerate → 201 + new raw key",
    expected: "201 + new key",
    actual: `${regen.status} + ${regen.json?.key ? "new key" : "none"}`,
    ok: regen.status === 201 && Boolean(regen.json?.key) && regen.json?.key !== rawKey,
  });
  const newRawKey = regen.json?.key;
  const oldKeyExtract = await req("POST", "/v1/extract", { token: rawKey, form: fd });
  record({
    test: "5b. Old key rejected after regenerate",
    expected: "401 INVALID_API_KEY",
    actual: `${oldKeyExtract.status} + ${oldKeyExtract.json?.errorCode}`,
    ok: oldKeyExtract.status === 401 && oldKeyExtract.json?.errorCode === "INVALID_API_KEY",
  });
  const newKeyExtract = await req("POST", "/v1/extract", { token: newRawKey, form: fd });
  record({
    test: "5c. New key works on /v1/extract",
    expected: "200 + records",
    actual: `${newKeyExtract.status} + ${newKeyExtract.json?.recordCount ?? 0} records`,
    ok: newKeyExtract.status === 200 && newKeyExtract.json?.recordCount === 2,
  });

  // Print results
  console.log("\n=== STEP 5: API KEY MANAGEMENT E2E RESULTS ===");
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