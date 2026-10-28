import { randomUUID } from "node:crypto";
import { requireUser } from "@/server/auth";
import { ZodError, z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { apiErrorFromUnknown } from "@/server/api/response";

export type RouteContext<T extends Record<string, string> = Record<string, never>> = {
  params: Promise<T>;
};

export function withPublicApi<C>(handler: (request: Request, context: C) => Promise<Response>) {
  return withApi(handler, { public: true });
}

export function withApi<C>(
  handler: (request: Request, context: C) => Promise<Response>,
  options: { public?: boolean } = {},
) {
  return async (request: Request, context: C) => {
    const requestId = randomUUID();
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        const origin = request.headers.get("origin");
        const url = new URL(request.url);
        // Next may use an internal hostname in request.url behind a reverse proxy.
        // Never use x-forwarded-host to select a credential-bearing destination.
        const expectedOrigin = process.env.APP_ORIGIN ?? `${request.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1)}://${request.headers.get("host") ?? url.host}`;
        if (request.headers.get("sec-fetch-site") === "cross-site" ||
            (origin && origin !== expectedOrigin)) {
          throw new ApiError(403, "CROSS_ORIGIN", "Send this request from the StockSense application.");
        }
      }
      if (!options.public) await requireUser(request);
      if (context && typeof context === "object" && "params" in context) {
        const params = await (context as { params: Promise<Record<string, string>> }).params;
        for (const [name, value] of Object.entries(params ?? {})) {
          if (/id$/i.test(name) && !z.uuid().safeParse(value).success) {
            throw new ApiError(400, "INVALID_ID", `${name} must be a valid UUID.`);
          }
        }
      }
      const response = await handler(request, context);
      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (error) {
      const normalized = normalizeError(error);
      if (normalized.status >= 500) {
        console.error("API request failed", { method: request.method, path: new URL(request.url).pathname, requestId, code: normalized.code, errorType: error instanceof Error ? error.name : "unknown" });
      }
      const response = apiErrorFromUnknown(normalized);
      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}

export function normalizeError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(" ");
    return new ApiError(400, "VALIDATION_ERROR", message || "Request is invalid.");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return uniqueConflict(error);
    }

    if (error.code === "P2025") {
      return new ApiError(404, "NOT_FOUND", "The requested record was not found.");
    }

    if (error.code === "P2003") {
      return new ApiError(400, "INVALID_REFERENCE", "A related record does not exist.");
    }
  }

  return new ApiError(500, "INTERNAL_ERROR", "The request could not be completed.");
}

function uniqueConflict(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.join(" ") : String(target ?? "");

  if (fields.includes("units_of_measure") || fields === "code" && error.meta?.modelName === "UnitOfMeasure") {
    return new ApiError(409, "DUPLICATE_UNIT_CODE", "A unit with this code already exists. Choose the existing unit.");
  }
  if (fields.includes("sku")) {
    return new ApiError(409, "DUPLICATE_SKU", "A product with this SKU already exists.");
  }

  if (fields.includes("warehouses") || fields === "code" || fields.includes("warehouses_code")) {
    return new ApiError(409, "DUPLICATE_WAREHOUSE_CODE", "A warehouse with this code already exists.");
  }

  if (fields.includes("warehouse_id") || fields.includes("locations_warehouse")) {
    return new ApiError(
      409,
      "DUPLICATE_LOCATION_CODE",
      "A location with this code already exists in the warehouse.",
    );
  }

  if (fields.includes("reference")) {
    return new ApiError(409, "DUPLICATE_REFERENCE", "An operation with this reference already exists.");
  }

  if (fields.includes("categories") || fields.includes("name")) {
    return new ApiError(409, "DUPLICATE_CATEGORY", "A category with this name already exists.");
  }

  if (fields.includes("email")) {
    return new ApiError(409, "DUPLICATE_EMAIL", "A user with this email already exists.");
  }

  return new ApiError(409, "CONFLICT", "This record conflicts with an existing one.");
}
