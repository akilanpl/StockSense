import { randomBytes } from "node:crypto";
import type { OperationType } from "@/generated/prisma/client";

const prefixes: Record<OperationType, string> = {
  RECEIPT: "RCP",
  DELIVERY: "DLV",
  TRANSFER: "TRF",
  ADJUSTMENT: "ADJ",
};

export function createOperationReference(type: OperationType) {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${prefixes[type]}-${stamp}-${suffix}`;
}
