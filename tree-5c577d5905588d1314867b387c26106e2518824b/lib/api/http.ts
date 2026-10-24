import type { ZodType } from "zod";
import { ApiClientError, failureFromPayload } from "@/lib/api/errors";

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
};

type AccessTokenProvider = () => Promise<string | null> | string | null;

let accessTokenProvider: AccessTokenProvider = () => null;

export function setAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider;
}

export async function request<T>(path: string, schema: ZodType<T>, options: RequestOptions = {}) {
  const headers = new Headers({ Accept: "application/json" });
  const token = await accessTokenProvider();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(await resolveUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
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

async function resolveUrl(path: string, query: RequestOptions["query"]) {
  const url = new URL(path, await origin());

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

async function origin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const { headers } = await import("next/headers");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new ApiClientError(0, "NETWORK", "The application URL is not available.");
  }

  return `${proto}://${host}`;
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
