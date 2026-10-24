import { apiFailureSchema } from "@/types/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export function userFacingMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      if (error.code === "INVALID_CREDENTIALS") {
        return error.message;
      }

      return "You need to sign in before continuing.";
    }

    if (error.status === 403) {
      return "You do not have permission to do that.";
    }

    if (error.status === 404) {
      return error.message || "That record was not found.";
    }

    if (error.status === 400 || error.status === 409) {
      return error.message;
    }

    if (error.status >= 500) {
      return "The server could not complete this request.";
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return "The network request failed. Check your connection and try again.";
  }

  return "This page could not be loaded.";
}

export function failureFromPayload(status: number, payload: unknown) {
  const parsed = apiFailureSchema.safeParse(payload);

  if (parsed.success) {
    return new ApiClientError(status, parsed.data.error.code, parsed.data.error.message);
  }

  return new ApiClientError(status, "INVALID_RESPONSE", "The server returned an unexpected error.");
}
