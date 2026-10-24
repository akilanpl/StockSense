import { Prisma, type OperationType } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";

const SCALE = 4;

export function positiveDecimal(value: unknown, label = "Quantity") {
  const decimal = parseDecimal(value, label);

  if (decimal.lessThanOrEqualTo(0)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be greater than zero.`);
  }

  return decimal;
}

export function quantityForOperation(type: OperationType, value: unknown) {
  if (type === "ADJUSTMENT") {
    return nonNegativeDecimal(value, "Counted quantity");
  }

  return positiveDecimal(value, "Quantity");
}

export function nonNegativeDecimal(value: unknown, label = "Quantity") {
  const decimal = parseDecimal(value, label);

  if (decimal.isNegative()) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} cannot be negative.`);
  }

  return decimal;
}

export function decimalToString(value: Prisma.Decimal) {
  return value.toString();
}

function parseDecimal(value: unknown, label: string) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be a number.`);
  }

  let decimal: Prisma.Decimal;

  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be a number.`);
  }

  if (!decimal.isFinite()) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be a finite number.`);
  }

  if (decimal.decimalPlaces() > SCALE) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} supports at most ${SCALE} decimal places.`);
  }

  return decimal;
}
