const fs = require("fs");
const { execSync } = require("child_process");

const run = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).toString().trim();

// 1. Register a user; capture their token
const userReg = run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/auth/register" -H "Content-Type: application/json" -d '{"organizationName":"Premium Flow Test Org","contactEmail":"premium.flow@test.com","password":"PremiumPass!123"}'`);
const userToken = JSON.parse(userReg).accessToken;

// 2. Submit premium request (first user)
const reqBody = JSON.parse(run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/premium/request" -H "Content-Type: application/json" -H "Authorization: Bearer ${userToken}" -d '{"requestedPlan":"business","paymentReference":"MOCK-TX-1234"}'`));
const reqId = reqBody.id;

// 3. Admin approves
const adminLogin = run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/admin/login" -H "Content-Type: application/json" -d '{"email":"admin@premium.test","password":"Admin!234"}'`);
const adminToken = JSON.parse(adminLogin).accessToken;
const approve = run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/admin/premium-requests/${reqId}/approve" -H "Content-Type: application/json" -H "Authorization: Bearer ${adminToken}"`);
console.log("approve =>", approve);

// 4. Reject a second (enterprise) request
const secondUserReg = run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/auth/register" -H "Content-Type: application/json" -d '{"organizationName":"Second Flow Org","contactEmail":"second.flow@test.com","password":"FlowSecond!456"}'`);
const userToken2 = JSON.parse(secondUserReg).accessToken;
const secondBody = JSON.parse(run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/premium/request" -H "Content-Type: application/json" -H "Authorization: Bearer ${userToken2}" -d '{"requestedPlan":"enterprise","paymentReference":"MMOCK-TX-334"}'`));
const secondReqId = JSON.parse(secondBody).id;
run(`curl -s -m 30 -X POST "http://127.0.0.1:5000/api/admin/premium-requests/${secondReqId}/reject" -H "Content-Type: application/json" -H "Authorization: Bearer ${adminToken}" -d '{"reason":"policy does not allow"}'`);
console.log("reject =>", secondReject);

fs.writeFileSync("api-server/test/premium-flow-test.mjs", "");
console.log("premium-flow-test written");
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

 <environment_details>
# Visual Studio Code Visible Files
api-server/test/premium-flow-test.cjs

# Visual Studio Code Open Tabs
api-server/test/tmp-login-body.json
api-server/docs/EthioBridge_Backend_API_Contract_for_Frontend.md
api-server/src/app.js
api
scripts/fix-migration-b
scripts/write-premium-backend.cjs
api-server/src/db/models/api-keys.js
api-server/src/db/models/rate-limits.js
api-server/src/routes/index.js
scripts/write-premium-test.cjs
api-server/src/config/env.js
api-server/.env
ethiobridge-frontend/.env
ethiobridge-frontend/src/lib/api/client.ts
scripts/write-admin-users
scripts/write-admin
scripts/write
api-server/test/step4-auth-e2e.mjs
scripts/write-step6.cjs
scripts/write-step7.cjs
api-server/src/db/models/admin-queries.js
scripts/write-debug.cjs
api-server/src/modules/api-keys/api-key-service.js
scripts
ethiobridge-frontend/src/lib/api/authApi.ts
scripts/write-dashboard
scripts/write-admin-dashboard.cjs
scripts/write-api-keys
scripts/write-playground.cjs

# Current Time
8/15/2026, 2:12:47 PM (Africa/Nairobi, UTC+3:00)

# Context Window Usage
474,667 / 1,048.576K tokens used (45%)

# Current Mode
ACT MODE
</environment_details>