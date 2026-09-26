import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { apiErrorFromUnknown } from "@/server/api/response";

export type RouteContext<T extends Record<string, string> = Record<string, never>> = {
  params: Promise<T>;
};

export function withApi<C>(
  handler: (request: Request, context: C) => Promise<Response>,
) {
  return async (request: Request, context: C) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return apiErrorFromUnknown(normalizeError(error));
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
