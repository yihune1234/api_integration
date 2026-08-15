import {
  submitRequest,
  getStatus,
  listPendingRequests,
  approveRequest,
  rejectRequest,
} from "./premium.service.js";

export async function premiumRequestHandler(request, response) {
  response.status(201).json(
    await submitRequest({
      userId: request.auth.userId,
      requestedPlan: request.body?.requestedPlan,
      paymentReference: request.body?.paymentReference,
      request,
    }),
  );
}

export async function premiumStatusHandler(request, response) {
  response.json({ status: "success", requests: await getStatus({ userId: request.auth.userId }) });
}

export async function listPendingRequestsHandler(request, response) {
  const includeAll = request.query?.includeAll === "true";
  response.json({ requests: await listPendingRequests({ includeAll }) });
}

export async function approveRequestHandler(request, response) {
  response.json(
    await approveRequest({
      requestId: request.params.id,
      adminId: request.admin.adminId,
      request,
    }),
  );
}

export async function rejectRequestHandler(request, response) {
  response.json(
    await rejectRequest({
      requestId: request.params.id,
      adminId: request.admin.adminId,
      rejectionReason: request.body?.rejectionReason,
      request,
    }),
  );
}
