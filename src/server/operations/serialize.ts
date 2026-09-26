import type {
  Location,
  Partner,
  Product,
  StockMove,
  StockOperation,
  StockOperationItem,
  StockQuant,
  User,
} from "@/generated/prisma/client";
import { decimalToString } from "@/server/inventory/decimal";

type OperationRecord = StockOperation & {
  partner: Partner | null;
  sourceLocation: Location | null;
  destinationLocation: Location | null;
  createdBy: User;
  items: Array<StockOperationItem & { product: Product }>;
  moves?: StockMove[];
};

export function serializeOperation(operation: OperationRecord) {
  return {
    id: operation.id,
    reference: operation.reference,
    type: operation.type,
    status: operation.status,
    partnerId: operation.partnerId,
    partnerName: operation.partner?.name ?? null,
    sourceLocationId: operation.sourceLocationId,
    sourceLocationCode: operation.sourceLocation?.code ?? null,
    destinationLocationId: operation.destinationLocationId,
    destinationLocationCode: operation.destinationLocation?.code ?? null,
    createdById: operation.createdById,
    createdByName: operation.createdBy.name,
    createdAt: operation.createdAt.toISOString(),
    updatedAt: operation.updatedAt.toISOString(),
    validatedAt: operation.validatedAt?.toISOString() ?? null,
    canceledAt: operation.canceledAt?.toISOString() ?? null,
    items: operation.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      requestedQuantity: decimalToString(item.requestedQuantity),
      processedQuantity: decimalToString(item.processedQuantity),
    })),
    moves: operation.moves?.map(serializeMove),
  };
}

export function serializeMove(
  move: StockMove & { product?: Product; operation?: StockOperation },
) {
  return {
    id: move.id,
    operationId: move.operationId,
    operationReference: move.operation?.reference,
    productId: move.productId,
    sku: move.product?.sku,
    sourceLocationId: move.sourceLocationId,
    destinationLocationId: move.destinationLocationId,
    quantity: decimalToString(move.quantity),
    movementType: move.movementType,
    createdAt: move.createdAt.toISOString(),
    completedAt: move.completedAt?.toISOString() ?? null,
  };
}

export function serializeQuant(
  quant: StockQuant & { product: Product; location: Location },
) {
  return {
    id: quant.id,
    productId: quant.productId,
    sku: quant.product.sku,
    productName: quant.product.name,
    locationId: quant.locationId,
    locationCode: quant.location.code,
    warehouseId: quant.location.warehouseId,
    quantity: decimalToString(quant.quantity),
    updatedAt: quant.updatedAt.toISOString(),
  };
}
