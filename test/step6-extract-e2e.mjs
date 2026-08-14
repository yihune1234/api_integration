/**
 * STEP 6 — Extraction Playground End-to-End verification.
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

const uniq = () => `extractflow_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

function fileForm(filename, buffer) {
  const fd = new FormData();
  fd.append("file", new Blob([buffer], { type: "application/octet-stream" }), filename);
  return fd;
}

async function main() {
  const email = `${uniq()}@example.com`;
  const reg = await req("POST", "/auth/register", {
    body: { organizationName: uniq(), contactEmail: email, password: "StrongPass123" },
  });
  const accessToken = reg.json?.accessToken;
  const keyCreate = await req("POST", "/api-keys", { token: accessToken, body: { plan: "free" } });
  const rawKey = keyCreate.json?.key;

  const jsonRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.json", Buffer.from('[{"name":"Alice","age":30}]')),
  });
  record({
    test: "1a. JSON extraction",
    expected: "200 + format=json + 1 record",
    actual: `${jsonRes.status} + format=${jsonRes.json?.format} + ${jsonRes.json?.recordCount} records`,
    ok: jsonRes.status === 200 && jsonRes.json?.format === "json" && jsonRes.json?.recordCount === 1,
  });

  const xmlRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.xml", Buffer.from("<root><name>Alice</name></root>")),
  });
  record({
    test: "1b. XML extraction",
    expected: "200 + format=xml",
    actual: `${xmlRes.status} + format=${xmlRes.json?.format}`,
    ok: xmlRes.status === 200 && xmlRes.json?.format === "xml",
  });

  const csvRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.csv", Buffer.from("name,age\nAlice,30\nBob,25")),
  });
  record({
    test: "1c. CSV extraction",
    expected: "200 + format=csv + 2 records",
    actual: `${csvRes.status} + format=${csvRes.json?.format} + ${csvRes.json?.recordCount} records`,
    ok: csvRes.status === 200 && csvRes.json?.format === "csv" && csvRes.json?.recordCount === 2,
  });

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.columns = [{ header: "name", key: "name" }, { header: "email", key: "email" }];
  ws.addRow({ name: "Alice", email: "alice@example.com" });
  ws.addRow({ name: "Bob", email: "bob@example.com" });
  const xlsxBuffer = Buffer.from(await wb.xlsx.writeBuffer());
  const xlsxRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.xlsx", xlsxBuffer),
  });
  record({
    test: "1d. XLSX extraction",
    expected: "200 + format=xlsx + records",
    actual: `${xlsxRes.status} + format=${xlsxRes.json?.format} + ${xlsxRes.json?.recordCount} records`,
    ok: xlsxRes.status === 200 && xlsxRes.json?.format === "xlsx" && xlsxRes.json?.recordCount > 0,
  });

  const txtRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.txt", Buffer.from("hello world")),
  });
  record({
    test: "2. Unsupported format (.txt)",
    expected: "415 UNSUPPORTED_FORMAT",
    actual: `${txtRes.status} + ${txtRes.json?.errorCode}`,
    ok: txtRes.status === 415 && txtRes.json?.errorCode === "UNSUPPORTED_FORMAT",
  });

  const big = Buffer.alloc(11 * 1024 * 1024, "x");
  const bigRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.csv", big),
  });
  record({
    test: "3. Oversized file (>10MB)",
    expected: "413 FILE_TOO_LARGE",
    actual: `${bigRes.status} + ${bigRes.json?.errorCode}`,
    ok: bigRes.status === 413 && bigRes.json?.errorCode === "FILE_TOO_LARGE",
  });

  const emptyRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.csv", Buffer.alloc(0)),
  });
  record({
    test: "4. Empty file",
    expected: "400 EMPTY_FILE",
    actual: `${emptyRes.status} + ${emptyRes.json?.errorCode}`,
    ok: emptyRes.status === 400 && emptyRes.json?.errorCode === "EMPTY_FILE",
  });

  const { query } = await import("../src/db/connection.js");
  const crypto = await import("node:crypto");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const found = await query("SELECT id FROM api_keys WHERE key_hash = ?", [keyHash]);
  const apiKeyId = found.rows[0]?.id;
  const futureReset = new Date(Date.now() + 60 * 60 * 1000);
  await query(
    "UPDATE rate_limits SET remaining_requests = 0, reset_at = ? WHERE api_key_id = ?",
    [futureReset, apiKeyId],
  );
  const rateRes = await req("POST", "/v1/extract", {
    token: rawKey,
    form: fileForm("data.csv", Buffer.from("name,age\nAlice,30")),
  });
  record({
    test: "5. Rate limit exhausted",
    expected: "429 RATE_LIMIT_EXCEEDED",
    actual: `${rateRes.status} + ${rateRes.json?.errorCode}`,
    ok: rateRes.status === 429 && rateRes.json?.errorCode === "RATE_LIMIT_EXCEEDED",
  });

  const usage = await req("GET", "/user/usage", { token: accessToken });
  record({
    test: "6. Usage numbers updated",
    expected: "total >= 5",
    actual: `total=${usage.json?.usage?.total}`,
    ok: usage.status === 200 && usage.json?.usage?.total >= 5,
  });

  console.log("\n=== STEP 6: EXTRACTION PLAYGROUND E2E RESULTS ===");
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
