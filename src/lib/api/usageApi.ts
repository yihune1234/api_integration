import { apiFetch } from "./client";

export interface ProfileResponse {
  status: string;
  user: {
    id: string;
    organizationName: string;
    contactEmail: string;
    status: string;
    createdAt: string;
  };
}

export interface UsageResponse {
  status: string;
  usage: {
    total: number;
    daily: number;
    monthly: number;
    failed: number;
    successful: number;
  };
}

export async function getProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/user/profile");
}

export async function getUsage(): Promise<UsageResponse> {
  return apiFetch<UsageResponse>("/user/usage");
}
