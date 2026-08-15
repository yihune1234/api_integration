import {
  createPremiumRequest,
  findPremiumRequestById,
  findPendingPremiumRequestByUserId,
  listPremiumRequests,
  listPremiumRequestsByUserId,
  updatePremiumRequestApproval,
} from "../../db/models/premiumRequest.model.js";
import { updateApiKeyPlan } from "../../db/models/api-keys.js";
import { updateRateLimitMax } from "../../db/models/rate-limits.js";
import { findPlanMaxRequests } from "../../db/models/admin-queries.js";
import { MockPaymentProvider } from "./mockPaymentProvider.js";
import { logActivity } from "../logging/activity-logger.js";

export class PremiumError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ── Provider wiring (the single swap point) ────────────────────────────────
// A real provider is selected here by env var. premium.service.js only calls
// the PaymentProvider interface methods (createPayment/verifyPayment), so
// swapping providers is a one-line config change.
function resolveProvider({ env = process.env } = {}) {
  const providerName = env.PAYMENT_PROVIDER ?? "mock";
  switch (providerName) {
    case "mock":
      return new MockPaymentProvider();
    // case "chapa": return new ChapaPaymentProvider();
    // case "telebirr": return new TelebirrPaymentProvider();
    default:
      throw new PremiumError(
        "INTERNAL_ERROR",
        `Unknown PAYMENT_PROVIDER: ${providerName}`,
        500,
      );
  }
}

const provider = resolveProvider();

function validatePlan(plan) {
  if (!["business", "enterprise"].includes(plan)) {
    throw new PremiumError(
      "VALIDATION_ERROR",
      "requestedPlan must be 'business' or 'enterprise'.",
      422,
    );
  }
  return plan;
}

export async function submitRequest({ userId, requestedPlan, paymentReference, request }) {
  validatePlan(requestedPlan);

  // A user can only have one pending request at a time.
  const pending = await findPendingPremiumRequestByUserId(userId);
  if (pending.rows[0]) {
    throw new PremiumError(
      "PREMIUM_REQUEST_PENDING",
      "You already have a pending premium request.",
      409,
    );
  }

  // Run the (mock) payment step through the provider interface.
  const ref = paymentReference?.trim() || (await provider.createPayment({ userId, plan: requestedPlan })).paymentReference;
  const verify = await provider.verifyPayment({ paymentReference: ref });
  const paymentStatus = verify.status === "mock_confirmed" ? "mock_confirmed" : "failed";

  const result = await createPremiumRequest({
    userId,
    requestedPlan,
    paymentReference: ref,
    paymentStatus,
  });
  await logActivity({ userId, action: "premium.requested", request });
  return result.rows[0];
}

export async function getStatus({ userId }) {
  const result = await listPremiumRequestsByUserId(userId);
  return result.rows;
}

export async function listPendingRequests({ includeAll = false } = {}) {
  const result = await listPremiumRequests({ includeAll });
  return result.rows;
}

export async function approveRequest({ requestId, adminId, request }) {
  const result = await findPremiumRequestById(requestId);
  const premium = result.rows[0];
  if (!premium) {
    throw new PremiumError("PREMIUM_REQUEST_NOT_FOUND", "Premium request was not found.", 404);
  }
  if (premium.approval_status !== "pending") {
    throw new PremiumError(
      "PREMIUM_REQUEST_NOT_FOUND",
      `Premium request was already ${premium.approval_status}.`,
      409,
    );
  }
  if (premium.payment_status !== "mock_confirmed") {
    throw new PremiumError(
      "PAYMENT_NOT_CONFIRMED",
      "A premium request cannot be approved until its payment is confirmed.",
      409,
    );
  }

  // Apply the plan change through the EXISTING api_keys and rate_limits model
  // functions — the approved integration point. Never duplicate that logic here.
  const planName = premium.requested_plan;
  const planRow = (await findPlanMaxRequests(planName)).rows[0];
  const maxRequests = planRow ? planRow.max_requests : 0;

  await updateApiKeyPlan({ userId: premium.user_id, plan: planName });
  await updateRateLimitMax({ userId: premium.user_id, maxRequests });

  const updated = await updatePremiumRequestApproval({
    id: requestId,
    approvalStatus: "approved",
    reviewedBy: adminId,
  });
  await logActivity({ userId: premium.user_id, action: "premium.approved", request });
  return updated.rows[0];
}

export async function rejectRequest({ requestId, adminId, rejectionReason, request }) {
  const result = await findPremiumRequestById(requestId);
  const premium = result.rows[0];
  if (!premium) {
    throw new PremiumError("PREMIUM_REQUEST_NOT_FOUND", "Premium request was not found.", 404);
  }
  if (premium.approval_status !== "pending") {
    throw new PremiumError(
      "PREMIUM_REQUEST_NOT_FOUND",
      `Premium request was already ${premium.approval_status}.`,
      409,
    );
  }

  const updated = await updatePremiumRequestApproval({
    id: requestId,
    approvalStatus: "rejected",
    reviewedBy: adminId,
    rejectionReason: rejectionReason?.trim() || null,
  });
  await logActivity({ userId: premium.user_id, action: "premium.rejected", request });
  return updated.rows[0];
}
