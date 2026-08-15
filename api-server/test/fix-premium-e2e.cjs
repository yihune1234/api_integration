const fs = require("fs");
const p = "api-server/test/premium-e2e.mjs";
let c = fs.readFileSync(p, "utf8");
c = c.replace(
  /const \{ query \} = await import\("\.\/helpers\/db-helper\.mjs"\);\s*const db = await query;\s*/,
  'const { query: db } = await import("../src/db/connection.js");\n  ',
);
fs.writeFileSync(p, c, "utf8");
console.log("db-helper still present:", c.includes("db-helper"));
console.log("wrote premium-e2e.mjs");