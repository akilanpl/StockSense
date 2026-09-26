import type { ZodType } from "zod";
import { ApiClientError, failureFromPayload } from "@/lib/api/errors";

type BrowserRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function browserRequest<T>(path: string, schema: ZodType<T>, options: BrowserRequestOptions = {}) {
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiClientError(0, "NETWORK", "The network request failed.");
    }

    throw error;
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw failureFromPayload(response.status, payload);
  }

  if (!isSuccessPayload(payload)) {
    throw new ApiClientError(
      response.status,
      "INVALID_RESPONSE",
      "The server response did not match the expected data.",
    );
  }

  const parsed = schema.safeParse(payload.data);

  if (!parsed.success) {
    throw new ApiClientError(
      response.status,
      "RESPONSE_MISMATCH",
      "The server response did not match the expected data.",
    );
  }

  return parsed.data;
}

async function readPayload(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ApiClientError(response.status, "INVALID_RESPONSE", "The server returned an unreadable response.");
  }
}

function isSuccessPayload(payload: unknown): payload is { ok: true; data: unknown } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "ok" in payload &&
    payload.ok === true &&
    "data" in payload
  );
}
