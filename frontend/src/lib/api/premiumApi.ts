import { apiFetch } from "./client";

export type PremiumPlan = "business" | "enterprise";
export type PremiumRequestStatus = "pending" | "approved" | "rejected";

export interface PremiumRequest {
  id: string;
  user_id: string;
  requested_plan: PremiumPlan;
  payment_reference: string | null;
  payment_status: string;
  approval_status: PremiumRequestStatus;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  user_organization?: string;
  user_email?: string;
}

export function getPremiumStatus() {
  return apiFetch<{ status: string; requests: PremiumRequest[] }>("/premium/status");
}

export function submitPremiumRequest(requestedPlan: PremiumPlan, paymentReference?: string) {
  return apiFetch<PremiumRequest>("/premium/request", {
    method: "POST",
    body: { requestedPlan, paymentReference },
  });
}

export function listPremiumRequests(includeAll = true) {
  return apiFetch<{ requests: PremiumRequest[] }>(`/admin/premium-requests?includeAll=${includeAll}`);
}

export function approvePremiumRequest(id: string) {
  return apiFetch<PremiumRequest>(`/admin/premium-requests/${id}/approve`, { method: "POST" });
}

export function rejectPremiumRequest(id: string, rejectionReason?: string) {
  return apiFetch<PremiumRequest>(`/admin/premium-requests/${id}/reject`, {
    method: "POST",
    body: { rejectionReason },
  });
}
