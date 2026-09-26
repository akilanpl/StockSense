import { ApiError } from "@/server/api/errors";

export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();

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
