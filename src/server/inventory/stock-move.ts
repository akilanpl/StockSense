import { Prisma, type MovementType } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient;

export async function createStockMove(
  db: Db,
  input: {
    operationId: string;
    productId: string;
    quantity: Prisma.Decimal;
    movementType: MovementType;
    sourceLocationId?: string | null;
    destinationLocationId?: string | null;
    completedAt: Date;
  },
) {
  return db.stockMove.create({
    data: {
      operationId: input.operationId,
      productId: input.productId,
      quantity: input.quantity,
      movementType: input.movementType,
      sourceLocationId: input.sourceLocationId ?? null,
      destinationLocationId: input.destinationLocationId ?? null,
      completedAt: input.completedAt,
    },
  });
}
