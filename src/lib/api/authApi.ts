import { apiFetch, setTokens, clearTokens, setSession, getSession, getAccessToken, ApiError } from "./client";

export interface User {
  id: string;
  organizationName: string;
  contactEmail: string;
  status: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
}

export interface RegisterResponse extends AuthTokens {
  user: User;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface Session {
  role: "user" | "admin";
  id: string;
  organizationName?: string;
  contactEmail?: string;
  status?: string;
  adminEmail?: string;
  adminRole?: string;
}

export interface ProfileResponse {
  status: string;
  user: User;
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

export async function register(body: {
  organizationName: string;
  contactEmail: string;
  password: string;
}): Promise<RegisterResponse> {
  const data = await apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body,
    skipAuth: true,
  });
  setTokens(data.accessToken, data.refreshToken);
  setSession({
    role: "user",
    id: data.user.id,
    organizationName: data.user.organizationName,
    contactEmail: data.user.contactEmail,
    status: data.user.status,
  } satisfies Session);
  return data;
}

export async function login(body: {
  contactEmail: string;
  password: string;
}): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body,
    skipAuth: true,
  });
  setTokens(data.accessToken, data.refreshToken);
  setSession({
    role: "user",
    id: data.user.id,
    organizationName: data.user.organizationName,
    contactEmail: data.user.contactEmail,
    status: data.user.status,
  } satisfies Session);
  return data;
}

export async function adminLogin(body: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  tokenType: string;
  admin: { id: string; email: string; role: string };
}> {
  const data = await apiFetch<{
    accessToken: string;
    tokenType: string;
    admin: { id: string; email: string; role: string };
  }>("/admin/login", {
    method: "POST",
    body,
    skipAuth: true,
  });
  setTokens(data.accessToken);
  setSession({
    role: "admin",
    id: data.admin.id,
    adminEmail: data.admin.email,
    adminRole: data.admin.role,
  } satisfies Session);
  return data;
}

export async function refresh(): Promise<AuthTokens> {
  const refreshToken = localStorage.getItem("eb_refresh_token");
  const data = await apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    skipAuth: true,
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiFetch("/auth/change-password", { method: "POST", body });
}

export async function requestPasswordReset(body: {
  contactEmail: string;
}): Promise<{ message: string; resetToken?: string; developmentOnly?: boolean }> {
  return apiFetch("/auth/reset-password", { method: "POST", body, skipAuth: true });
}

export async function confirmPasswordReset(body: {
  resetToken: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiFetch("/auth/reset-password/confirm", { method: "POST", body, skipAuth: true });
}

export async function logout(): Promise<void> {
  clearTokens();
}

export { getSession, setSession, getAccessToken, clearTokens, ApiError };
