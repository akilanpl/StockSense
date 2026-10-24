import { NextResponse } from "next/server";
import { ApiError } from "@/server/api/errors";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function apiSuccess<T>(data: T, status = 200) {
  const body: ApiSuccess<T> = { ok: true, data };
  return NextResponse.json(body, { status });
}

export function apiError(code: string, message: string, status: number) {
  const body: ApiFailure = { ok: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export function notImplemented(resource: string) {
  return apiError(
    "NOT_IMPLEMENTED",
    `${resource} is prepared but has no business logic in this phase.`,
    501,
  );
}

export function apiErrorFromUnknown(error: unknown) {
  if (error instanceof ApiError) {
    return apiError(error.code, error.message, error.status);
  }

  return apiError("INTERNAL_ERROR", "The request could not be completed.", 500);
}
