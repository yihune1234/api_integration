import { query } from "../connection.js";
import { randomUUID } from "node:crypto";

export async function createPremiumRequest({
  userId,
  requestedPlan,
  paymentReference,
  paymentStatus = "mock_confirmed",
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO premium_requests
      (id, user_id, requested_plan, payment_reference, payment_status)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, requestedPlan, paymentReference, paymentStatus],
  );
  return findPremiumRequestById(id);
}

export function findPremiumRequestById(id) {
  return query("SELECT * FROM premium_requests WHERE id = ?", [id]);
}

export function findPendingPremiumRequestByUserId(userId) {
  return query(
    "SELECT * FROM premium_requests WHERE user_id = ? AND approval_status = 'pending' ORDER BY created_at DESC LIMIT 1",
    [userId],
  );
}

/**
 * Used when a paid API key is presented. This is an entitlement check, not
 * merely a UI rule: paid key usage is valid only after an admin approval.
 */
export function findApprovedPremiumRequestByUserIdAndPlan(userId, plan) {
  return query(
    `SELECT id FROM premium_requests
     WHERE user_id = ? AND requested_plan = ? AND approval_status = 'approved'
     ORDER BY reviewed_at DESC LIMIT 1`,
    [userId, plan],
  );
}

export function listPremiumRequestsByUserId(userId) {
  return query(
    "SELECT * FROM premium_requests WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
}

export function listPremiumRequests({ includeAll = false } = {}) {
  const where = includeAll ? "" : "WHERE approval_status = 'pending'";
  return query(
    `SELECT pr.*, u.organization_name AS user_organization, u.contact_email AS user_email
     FROM premium_requests pr
     LEFT JOIN users u ON u.id = pr.user_id
     ${where}
     ORDER BY pr.created_at DESC`,
  );
}

export async function updatePremiumRequestApproval({ id, approvalStatus, reviewedBy, rejectionReason = null }) {
  await query(
    `UPDATE premium_requests
     SET approval_status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
     WHERE id = ?`,
    [approvalStatus, reviewedBy, rejectionReason, id],
  );
  return findPremiumRequestById(id);
}
