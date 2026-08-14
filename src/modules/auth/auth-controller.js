import {
  changePassword,
  confirmPasswordReset,
  login,
  refresh,
  register,
  requestPasswordReset,
} from "./auth-service.js";

export async function registerHandler(request, response) {
  const result = await register(request.body ?? {}, request);
  response.status(201).json(result);
}

export async function loginHandler(request, response) {
  response.json(await login(request.body ?? {}, request));
}

export async function refreshHandler(request, response) {
  response.json(await refresh(request.body?.refreshToken, request));
}

export async function changePasswordHandler(request, response) {
  response.json(
    await changePassword(request.auth.userId, request.body ?? {}, request),
  );
}

export async function requestPasswordResetHandler(request, response) {
  response.json(await requestPasswordReset(request.body ?? {}, request));
}

export async function confirmPasswordResetHandler(request, response) {
  response.json(await confirmPasswordReset(request.body ?? {}, request));
}