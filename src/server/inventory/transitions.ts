import type { OperationStatus } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";

const allowed: Record<OperationStatus, OperationStatus[]> = {
  DRAFT: ["WAITING", "READY", "CANCELED"],
  WAITING: ["READY", "CANCELED"],
  READY: ["DONE", "CANCELED"],
  DONE: [],
  CANCELED: [],
};

export function assertCanTransition(from: OperationStatus, to: OperationStatus) {
  if (!allowed[from].includes(to)) {
    throw new ApiError(
      409,
      "INVALID_STATE",
      `Cannot change an operation from ${from} to ${to}.`,
    );
  }
}

export function assertDraft(status: OperationStatus, action: string) {
  if (status !== "DRAFT") {
    throw new ApiError(409, "INVALID_STATE", `Cannot ${action} an operation that is ${status}.`);
  }
}
