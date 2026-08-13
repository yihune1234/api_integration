import { apiFetch } from "./client";

export interface ApiKeyMetadata {
  id: string;
  keyPrefix: string;
  status: string;
  plan: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  key: string;
  apiKey: ApiKeyMetadata;
  warning: string;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKeyMetadata[];
}

export interface RevokeApiKeyResponse {
  apiKey: ApiKeyMetadata;
}

export async function createApiKey(plan = "free"): Promise<CreateApiKeyResponse> {
  return apiFetch<CreateApiKeyResponse>("/api-keys", {
    method: "POST",
    body: { plan },
  });
}

export async function listApiKeys(): Promise<ListApiKeysResponse> {
  return apiFetch<ListApiKeysResponse>("/api-keys");
}

export async function revokeApiKey(id: string): Promise<RevokeApiKeyResponse> {
  return apiFetch<RevokeApiKeyResponse>(`/api-keys/${id}/revoke`, {
    method: "POST",
  });
}

export async function regenerateApiKey(id: string): Promise<CreateApiKeyResponse> {
  return apiFetch<CreateApiKeyResponse>(`/api-keys/${id}/regenerate`, {
    method: "POST",
  });
}
