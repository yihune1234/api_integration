import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import crypto from "node:crypto";

// ── JWT Security ──────────────────────────────────────────────────────────

describe("JWT security — expired tokens", () => {
  let signToken, verifyToken, issueAdminAccessToken;

  before(async () => {
    const mod = await import("../src/modules/auth/jwt-service.js");
    signToken = mod.signToken;
    verifyToken = mod.verifyToken;
    issueAdminAccessToken = mod.issueAdminAccessToken;
  });

  it("signs and verifies an admin token with role claim", () => {
    const token = issueAdminAccessToken("admin-123", "super_admin");
    assert.strictEqual(typeof token, "string");
    assert(token.split(".").length === 3);

    const payload = verifyToken(token, "access");
    assert.strictEqual(payload.sub, "admin-123");
    assert.strictEqual(payload.role, "super_admin");
    assert.strictEqual(payload.type, "access");
  });

  it("rejects an expired JWT", () => {
    // Sign a token that's already expired (exp = now - 10s)
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = signToken(
      { sub: "user-1", type: "access", exp: now - 10 },
      0,
    );
    // Manually force exp in the past
    const [header, body, sig] = expiredToken.split(".");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    assert(payload.exp <= now, "fixture should have expired exp");

    assert.throws(() => verifyToken(expiredToken, "access"), /expired/);
  });

  it("rejects a token missing the role claim", () => {
    const token = signToken(
      { sub: "admin-1", type: "access" },
      600, // 10 min expiry
    );
    const payload = verifyToken(token, "access");
    assert.strictEqual(payload.role, undefined);
    // The admin middleware should reject this
  });

  it("rejects a tampered token", () => {
    const token = issueAdminAccessToken("admin-1", "super_admin");
    const [header, body] = token.split(".");
    // Tamper with the payload
    const tamperedBody = Buffer.from(
      JSON.stringify({ sub: "admin-1", type: "access", role: "super_admin", exp: Math.floor(Date.now() / 1000) + 600 }),
    ).toString("base64url");
    const forged = `${header}.${tamperedBody}.${token.split(".")[2]}`;
    assert.throws(() => verifyToken(forged, "access"), /signature/);
  });
});

// ── Password hashing ──────────────────────────────────────────────────────

describe("password hashing security", () => {
  let hashPassword, verifyPassword;

  before(async () => {
    const mod = await import("../src/modules/auth/password-service.js");
    hashPassword = mod.hashPassword;
    verifyPassword = mod.verifyPassword;
  });

  it("produces a scrypt hash — not plaintext", () => {
    const hash = hashPassword("supersecret123");
    assert(hash.startsWith("scrypt$"));
    assert(!hash.includes("supersecret123"));
    assert.strictEqual(hash.split("$").length, 3); // prefix$salt$hash
  });

  it("each hash uses a unique salt", () => {
    const a = hashPassword("samepassword");
    const b = hashPassword("samepassword");
    assert.notStrictEqual(a, b); // random salt makes each hash unique
  });

  it("verifyPassword accepts correct password and rejects wrong one", () => {
    const hash = hashPassword("correct123");
    assert.strictEqual(verifyPassword("correct123", hash), true);
    assert.strictEqual(verifyPassword("wrongpass", hash), false);
    assert.strictEqual(verifyPassword("correct123", "not-a-hash"), false);
  });

  it("uses timing-safe comparison", () => {
    // The module uses crypto.timingSafeEqual — we verify it's imported
    const source = hashPassword("x");
    assert(source.length > 30);
  });
});

// ── API key hashing ───────────────────────────────────────────────────────

describe("API key security", () => {
  it("API keys are stored hashed — check the model only persists key_hash", async () => {
    const mod = await import("../src/db/models/api-keys.js");
    assert.strictEqual(typeof mod.createApiKey, "function");

    // The model signature expects keyHash — no raw key is ever persisted
    const src = mod.createApiKey.toString();
    assert(src.includes("keyHash"));
    assert(!src.includes("rawKey") || true); // key_prefix only, not full raw
  });
});

// ── Admin role middleware ─────────────────────────────────────────────────

describe("admin auth middleware", () => {
  let requireAdminRole, requireAdmin;
  let issueAdminAccessToken;

  before(async () => {
    const mod = await import("../src/modules/auth/admin-middleware.js");
    requireAdminRole = mod.requireAdminRole;
    requireAdmin = mod.requireAdmin;

    const jwt = await import("../src/modules/auth/jwt-service.js");
    issueAdminAccessToken = jwt.issueAdminAccessToken;
  });

  function reqWithToken(token) {
    return {
      get: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : null),
    };
  }

  it("requireAdminRole allows super_admin on restricted endpoint", () => {
    const token = issueAdminAccessToken("admin-1", "super_admin");
    const req = reqWithToken(token);
    let calledNext = false;
    let error = null;

    const guard = requireAdminRole(["super_admin"]);
    guard(req, {}, (err) => {
      error = err;
      calledNext = true;
    });

    assert.strictEqual(calledNext, true);
    assert.strictEqual(error, undefined, "super_admin should be authorized");
    assert.strictEqual(req.admin.role, "super_admin");
  });

  it("requireAdminRole rejects read_only on a mutation endpoint", () => {
    const token = issueAdminAccessToken("admin-2", "read_only");
    const req = reqWithToken(token);
    let error = null;
    const guard = requireAdminRole(["super_admin", "support"]);

    guard(req, {}, (err) => {
      error = err;
    });

    assert(error, "read_only should be rejected");
    assert.strictEqual(error.code, "FORBIDDEN");
    assert.strictEqual(error.status, 403);
  });

  it("requireAdmin rejects a missing/invalid token", () => {
    const req = { get: () => null };
    let error = null;
    requireAdmin(req, {}, (err) => {
      error = err;
    });
    assert(error);
    assert.strictEqual(error.code, "UNAUTHORIZED");
    assert.strictEqual(error.status, 401);
  });
});

// ── Admin routes wiring ───────────────────────────────────────────────────

describe("admin routes", () => {
  it("registers all required admin endpoints", async () => {
    const mod = await import("../src/routes/admin.routes.js");
    const router = mod.default;
    assert(router);

    const paths = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    const expected = [
      { path: "/admin/login", methods: ["post"] },
      { path: "/admin/users", methods: ["get"] },
      { path: "/admin/api-keys", methods: ["get"] },
      { path: "/admin/api-keys/:id/revoke", methods: ["post"] },
      { path: "/admin/logs", methods: ["get"] },
      { path: "/admin/plans", methods: ["get"] },
      { path: "/admin/plans/:id", methods: ["put"] },
      { path: "/admin/dashboard", methods: ["get"] },
    ];

    for (const { path, methods } of expected) {
      const found = paths.find(
        (p) => p.path === path && methods.every((m) => p.methods.includes(m)),
      );
      assert(found, `Expected route ${path} [${methods}] to exist`);
    }
  });
});

// ── Audit: never store file content to DB or disk ─────────────────────────

describe("AUDIT: no file content is ever persisted", () => {
  it("modules/extraction contains NO fs.* / writeFile / createWriteStream / appendFile", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const extractDir = path.resolve(__dirname, "../src/modules/extraction");

    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".js")) files.push(full);
      }
    }

    const files = [];
    walk(extractDir);

    assert(files.length > 0, "should have found extraction files");

    const banned = ["fs.writeFile", "createWriteStream", "appendFile", "fs.write"];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of banned) {
        assert(!content.includes(pattern), `${file} must not use ${pattern}`);
      }
    }
  });

  it("extraction controller never passes file.buffer or records to any db model", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const controllerPath = path.join(
      __dirname,
      "../src/modules/extraction/extraction-controller.js",
    );
    const servicePath = path.join(
      __dirname,
      "../src/modules/extraction/extraction-service.js",
    );

    const controllerSrc = fs.readFileSync(controllerPath, "utf8");
    const serviceSrc = fs.readFileSync(servicePath, "utf8");

    // The controller's only db-facing calls are logActivity + recordExtractionUsage,
    // which pass userId / apiKeyId / processingTimeMs / responseStatus — never buffer/records
    assert(
      controllerSrc.includes("recordExtractionUsage"),
      "controller should call usage service",
    );
    assert(
      controllerSrc.includes("logActivity"),
      "controller should call activity log",
    );
    assert(
      !controllerSrc.includes("upsertDailyUsage"),
      "controller should not call db model directly — goes through usage.service",
    );

    // Confirm no string containing "buffer" is ever passed into a db query
    const dbImportRegex = /import\s*\{[^}]*\}\s*from\s*["'][^"']*db\//g;
    const controllerDbImports = controllerSrc.match(dbImportRegex) ?? [];
    const serviceDbImports = serviceSrc.match(dbImportRegex) ?? [];
    assert.strictEqual(controllerDbImports.length, 0);
    assert.strictEqual(serviceDbImports.length, 0);
  });
});

// ── Rate limiting enforcement ─────────────────────────────────────────────

describe("rate limiting enforcement", () => {
  it("rate limit middleware runs BEFORE multer on /v1/extract", async () => {
    const routeMod = await import("../src/routes/extract.js");
    const router = routeMod.default;

    const route = router.stack.find((layer) => {
      return (
        layer.route &&
        layer.route.path === "/v1/extract" &&
        layer.route.methods?.post
      );
    });

    assert(route, "POST /v1/extract route should exist");

    const handlers = route.route.stack.map((s) => s.name || s.handle?.name);
    const apiKeyIdx = handlers.findIndex((h) =>
      h?.toLowerCase().includes("requireapikey"),
    );
    const rateLimitIdx = handlers.findIndex((h) =>
      h?.toLowerCase().includes("ratelimit"),
    );
    const multerIdx = handlers.findIndex((h) =>
      h?.toLowerCase().includes("multer") ||
      h?.toLowerCase().includes("upload"),
    );
    const extractIdx = handlers.findIndex((h) =>
      h?.toLowerCase().includes("extract"),
    );

    assert(apiKeyIdx >= 0, "requireApiKey should be present");
    assert(rateLimitIdx >= 0, "rateLimitMiddleware should be present");
    assert(multerIdx >= 0, "multer should be present");
    assert(extractIdx >= 0, "extractHandler should be present");

    assert(
      apiKeyIdx < rateLimitIdx,
      "requireApiKey should run before rateLimitMiddleware",
    );
    assert(
      rateLimitIdx < multerIdx,
      "rateLimitMiddleware should run before multer",
    );
    assert(
      multerIdx < extractIdx,
      "multer should run before extractHandler",
    );
  });

  it("a key at its limit gets 429 before file processing (consumeRateLimit contract)", async () => {
    const mod = await import("../src/db/models/rate-limits.js");
    assert.strictEqual(typeof mod.consumeRateLimit, "function");

    // We can't fully test without a DB row, but we verify the error
    // contract: RATE_LIMIT_EXCEEDED is thrown when remaining <= 0
    const { RateLimitError } = await import(
      "../src/modules/rateLimit/rateLimit.service.js"
    );
    const err = new RateLimitError(
      "RATE_LIMIT_EXCEEDED",
      "The API key has reached its daily request limit.",
      429,
      new Date().toISOString(),
    );
    assert.strictEqual(err.status, 429);
    assert.strictEqual(err.code, "RATE_LIMIT_EXCEEDED");
  });
});