import { ApiError } from "@/server/api/errors";

export async function readJsonBody(request: Request): Promise<unknown> {
  const limit = 1_048_576;
  if (Number(request.headers.get("content-length")) > limit) {
    throw new ApiError(413, "BODY_TOO_LARGE", "Request body must be at most 1 MiB.");
  }
  if (request.body && !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send JSON with Content-Type: application/json.");
  }
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  if (reader) {
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel();
          throw new ApiError(413, "BODY_TOO_LARGE", "Request body must be at most 1 MiB.");
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
  }

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function readSearchParam(request: Request, name: string) {
  return new URL(request.url).searchParams.get(name);
}
