import { z } from "zod";
import { ApiError } from "@/server/api/errors";

export function parseInput<T>(schema: z.ZodType<T>, value: unknown) {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    throw new ApiError(400, "VALIDATION_ERROR", message || "Request is invalid.");
  }

  return parsed.data;
}

export const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

export const optionalText = z.string().trim().min(1).nullable().optional();

export const idSchema = z.uuid("A valid id is required.");
