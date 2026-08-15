
import {
  createForUser,
  listForUser,
  regenerateForUser,
  revokeForUser,
} from "./api-key-service.js";

function idFromRequest(request) {
  const id = Array.isArray(request.params.id)
    ? request.params.id[0]
    : request.params.id;
  if (!id) {
    const error = new Error("API key id is required.");
    error.code = "VALIDATION_ERROR";
    error.status = 422;
    throw error;
  }
  return id;
}

export async function createApiKeyHandler(request, response) {
  response.status(201).json(
    await createForUser(request.auth.userId, request.body ?? {}, request),
  );
}

export async function listApiKeysHandler(request, response) {
  response.json({ apiKeys: await listForUser(request.auth.userId) });
}

export async function revokeApiKeyHandler(request, response) {
  response.json(
    await revokeForUser(request.auth.userId, idFromRequest(request), request),
  );
}

export async function regenerateApiKeyHandler(request, response) {
  response.status(201).json(
    await regenerateForUser(
      request.auth.userId,
      idFromRequest(request),
      request,
    ),
  );
}