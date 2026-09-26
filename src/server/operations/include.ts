import type { Prisma } from "@/generated/prisma/client";

export const operationInclude = {
  partner: true,
  sourceLocation: true,
  destinationLocation: true,
  createdBy: true,
  items: {
    include: { product: true },
    orderBy: { createdAt: "asc" as const },
  },
  moves: {
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.StockOperationInclude;

export type OperationRecord = Prisma.StockOperationGetPayload<{
  include: typeof operationInclude;
}>;
