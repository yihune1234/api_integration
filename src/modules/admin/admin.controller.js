import {
  dashboardStats,
  listApiKeys,
  listLogs,
  listPlans,
  listUsers,
  loginAdmin,
  revokeApiKey,
  updatePlan,
} from "./admin.service.js";

function queryParam(request, name) {
  const value = request.query[name];
  return Array.isArray(value) ? value[0] : value;
}

export async function adminLoginHandler(request, response) {
  response.json(await loginAdmin(request.body ?? {}, request));
}

export async function listUsersHandler(request, response) {
  response.json(
    await listUsers({
      limit: queryParam(request, "limit"),
      offset: queryParam(request, "offset"),
    }),
  );
}

export async function listApiKeysHandler(request, response) {
  response.json(
    await listApiKeys({
      limit: queryParam(request, "limit"),
      offset: queryParam(request, "offset"),
    }),
  );
}

export async function revokeApiKeyHandler(request, response) {
  response.json(await revokeApiKey(request.params.id));
}

export async function listLogsHandler(request, response) {
  response.json(
    await listLogs({
      limit: queryParam(request, "limit"),
      offset: queryParam(request, "offset"),
      userId: queryParam(request, "userId"),
      action: queryParam(request, "action"),
      fromDate: queryParam(request, "fromDate"),
      toDate: queryParam(request, "toDate"),
    }),
  );
}

export async function listPlansHandler(request, response) {
  response.json(await listPlans());
}

export async function updatePlanHandler(request, response) {
  response.json(
    await updatePlan(request.params.id, request.body ?? {}),
  );
}

export async function dashboardHandler(request, response) {
  response.json({ status: "success", stats: await dashboardStats() });
}