import { apiFetch } from "./client";

export interface AdminUser {
  id: string;
  organization_name: string;
  contact_email: string;
  status: string;
  plan: "free" | "business" | "enterprise";
  created_at: string;
}

export interface AdminApiKey {
  id: string;
  user_id: string;
  key_prefix: string;
  status: string;
  plan: string;
  expires_at: string | null;
  created_at: string;
  user_organization: string;
  user_email: string;
}

export interface AdminLog {
  id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  endpoint: string | null;
  timestamp: string;
  user_organization: string | null;
  user_email: string | null;
}

export interface AdminPlan {
  id: string;
  name: string;
  max_requests: number;
}

export interface AdminDashboardStats {
  users: { total: number; active: number };
  apiKeys: { total: number; active: number };
  requests: {
    total: number;
    today: number;
    monthly: number;
    failed: number;
    quota: { limit: number; used: number; remaining: number };
  };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  limit: number;
  offset: number;
}

export interface AdminApiKeysResponse {
  apiKeys: AdminApiKey[];
  limit: number;
  offset: number;
}

export interface AdminLogsResponse {
  logs: AdminLog[];
  limit: number;
  offset: number;
}

export interface AdminPlansResponse {
  plans: AdminPlan[];
}

export interface AdminDashboardResponse {
  status: string;
  stats: AdminDashboardStats;
}

export async function listAdminUsers(): Promise<AdminUsersResponse> {
  return apiFetch<AdminUsersResponse>("/admin/users");
}

export async function listAdminApiKeys(): Promise<AdminApiKeysResponse> {
  return apiFetch<AdminApiKeysResponse>("/admin/api-keys");
}

export async function revokeAdminApiKey(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/api-keys/${id}/revoke`, {
    method: "POST",
  });
}

export async function listAdminLogs(params: {
  userId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminLogsResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return apiFetch<AdminLogsResponse>(`/admin/logs${qs ? `?${qs}` : ""}`);
}

export async function listAdminPlans(): Promise<AdminPlansResponse> {
  return apiFetch<AdminPlansResponse>("/admin/plans");
}

export async function updateAdminPlan(id: string, maxRequests: number): Promise<AdminPlansResponse & { message: string }> {
  return apiFetch<AdminPlansResponse & { message: string }>(`/admin/plans/${id}`, {
    method: "PUT",
    body: { maxRequests },
  });
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  return apiFetch<AdminDashboardResponse>("/admin/dashboard");
}
