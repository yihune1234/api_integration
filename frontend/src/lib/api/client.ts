/**
 * Base API client — handles base URL, auth headers, token refresh, and errors.
 * Tokens are stored in localStorage (dev-hosted app; the backend returns tokens
 * in the JSON body — no httpOnly cookies, per the confirmed contract).
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:5000/api";

const ACCESS_TOKEN_KEY = "eb_access_token";
const REFRESH_TOKEN_KEY = "eb_refresh_token";
const SESSION_KEY = "eb_session";

export class ApiError extends Error {
  status: number;
  errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getSession<T = unknown>(): T | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setSession<T>(session: T): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function handleError(res: Response, data: any): Promise<never> {
  const message = data?.message ?? `Request failed with status ${res.status}`;
  const errorCode = data?.errorCode ?? "INTERNAL_ERROR";
  throw new ApiError(res.status, errorCode, message);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    form?: FormData;
    token?: string | null;
    skipAuth?: boolean;
  } = {},
): Promise<T> {
  const { method = "GET", body, form, token, skipAuth } = options;
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const authToken = skipAuth ? null : token ?? getAccessToken();
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let res = await fetch(url, { method, headers, body: payload });

  // If an access token was used and we get 401, try a silent refresh once.
  if (res.status === 401 && authToken && !skipAuth && getRefreshToken()) {
    const refreshToken = getRefreshToken();
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setTokens(refreshData.accessToken, refreshData.refreshToken);
        headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
        res = await fetch(url, { method, headers, body: payload });
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    }
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    await handleError(res, data);
  }
  return data as T;
}
