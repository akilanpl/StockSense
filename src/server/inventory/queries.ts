import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/prisma";
import { serializeMove, serializeQuant } from "@/server/operations/serialize";

export async function listMoves(filters: {
  productId?: string;
  movementType?: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  sourceLocationId?: string;
  destinationLocationId?: string;
  operationId?: string;
  from?: string;
  to?: string;
}) {
  const moves = await getPrisma().stockMove.findMany({
    where: {
      productId: filters.productId,
      movementType: filters.movementType,
      sourceLocationId: filters.sourceLocationId,
      destinationLocationId: filters.destinationLocationId,
      operationId: filters.operationId,
      createdAt: dateRange(filters.from, filters.to),
    },
    include: { product: true, operation: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return moves.map(serializeMove);
}

export async function listStock(filters: {
  productId?: string;
  locationId?: string;
  warehouseId?: string;
}) {
  const where: Prisma.StockQuantWhereInput = {
    productId: filters.productId,
    locationId: filters.locationId,
    location: filters.warehouseId ? { warehouseId: filters.warehouseId } : undefined,
  };

  const quants = await getPrisma().stockQuant.findMany({
    where,
    include: { product: true, location: true },
    orderBy: [{ product: { sku: "asc" } }, { location: { code: "asc" } }],
  });

  return quants.map(serializeQuant);
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) {
    return undefined;
  }

  return {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  };
}
