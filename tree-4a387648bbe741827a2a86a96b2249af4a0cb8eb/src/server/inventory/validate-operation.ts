import { Prisma, type StockOperation, type StockOperationItem } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { createStockMove } from "@/server/inventory/stock-move";
import {
  decreaseStock,
  getAvailableStock,
  increaseStock,
  lockStockPairs,
} from "@/server/inventory/stock-quant";
import { assertCanTransition } from "@/server/inventory/transitions";
import { operationInclude, type OperationRecord } from "@/server/operations/include";

type Db = Prisma.TransactionClient;
type Item = StockOperationItem;

export async function validateOperationInTransaction(db: Db, operationId: string) {
  await db.$queryRaw`
    SELECT id FROM stock_operations WHERE id = CAST(${operationId} AS uuid) FOR UPDATE
  `;

  const operation = await db.stockOperation.findUnique({
    where: { id: operationId },
    include: operationInclude,
  });

  if (!operation) {
    throw new ApiError(404, "NOT_FOUND", "Operation was not found.");
  }

  assertCanTransition(operation.status, "DONE");

  if (operation.items.length === 0) {
    throw new ApiError(409, "MISSING_ITEMS", "Add at least one product line before validation.");
  }

  const completedAt = new Date();

  switch (operation.type) {
    case "RECEIPT":
      await receive(db, operation, completedAt);
      break;
    case "DELIVERY":
      await deliver(db, operation, completedAt);
      break;
    case "TRANSFER":
      await transfer(db, operation, completedAt);
      break;
    case "ADJUSTMENT":
      await adjust(db, operation, completedAt);
      break;
    default:
      throw new ApiError(400, "VALIDATION_ERROR", "Operation type is not supported.");
  }

  return db.stockOperation.update({
    where: { id: operation.id },
    data: {
      status: "DONE",
      validatedAt: completedAt,
    },
    include: operationInclude,
  });
}

async function receive(db: Db, operation: OperationRecord, completedAt: Date) {
  const destinationId = await requireLocation(db, operation.destinationLocationId, "Destination");
  await assertLines(db, operation.type, operation.items);

  await lockStockPairs(
    db,
    operation.items.map((item) => ({ productId: item.productId, locationId: destinationId })),
  );

  for (const item of operation.items) {
    await increaseStock(db, item.productId, destinationId, item.requestedQuantity);
    await createStockMove(db, {
      operationId: operation.id,
      productId: item.productId,
      quantity: item.requestedQuantity,
      movementType: "RECEIPT",
      sourceLocationId: operation.sourceLocationId,
      destinationLocationId: destinationId,
      completedAt,
    });
    await markProcessed(db, item);
  }
}

async function deliver(db: Db, operation: OperationRecord, completedAt: Date) {
  const sourceId = await requireLocation(db, operation.sourceLocationId, "Source");
  await assertLines(db, operation.type, operation.items);
  const totals = totalsByProduct(operation.items);

  await lockStockPairs(
    db,
    [...totals.keys()].map((productId) => ({ productId, locationId: sourceId })),
  );

  for (const [productId, quantity] of totals) {
    const available = await getAvailableStock(db, productId, sourceId);
    if (available.lessThan(quantity)) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        `Not enough stock to deliver ${quantity.toString()}. Available quantity is ${available.toString()}.`,
      );
    }
  }

  for (const [productId, quantity] of totals) {
    await decreaseStock(db, productId, sourceId, quantity);
  }

  for (const item of operation.items) {
    await createStockMove(db, {
      operationId: operation.id,
      productId: item.productId,
      quantity: item.requestedQuantity,
      movementType: "DELIVERY",
      sourceLocationId: sourceId,
      destinationLocationId: operation.destinationLocationId,
      completedAt,
    });
    await markProcessed(db, item);
  }
}

async function transfer(db: Db, operation: OperationRecord, completedAt: Date) {
  const sourceId = await requireLocation(db, operation.sourceLocationId, "Source");
  const destinationId = await requireLocation(db, operation.destinationLocationId, "Destination");

  if (sourceId === destinationId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Transfer source and destination must differ.");
  }

  await assertLines(db, operation.type, operation.items);
  const totals = totalsByProduct(operation.items);
  const pairs = [...totals.keys()].flatMap((productId) => [
    { productId, locationId: sourceId },
    { productId, locationId: destinationId },
  ]);

  await lockStockPairs(db, pairs);

  for (const [productId, quantity] of totals) {
    const available = await getAvailableStock(db, productId, sourceId);
    if (available.lessThan(quantity)) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        `Not enough stock to transfer ${quantity.toString()}. Available quantity is ${available.toString()}.`,
      );
    }
  }

  for (const [productId, quantity] of totals) {
    await decreaseStock(db, productId, sourceId, quantity);
    await increaseStock(db, productId, destinationId, quantity);
  }

  for (const item of operation.items) {
    await createStockMove(db, {
      operationId: operation.id,
      productId: item.productId,
      quantity: item.requestedQuantity,
      movementType: "TRANSFER",
      sourceLocationId: sourceId,
      destinationLocationId: destinationId,
      completedAt,
    });
    await markProcessed(db, item);
  }
}

async function adjust(db: Db, operation: OperationRecord, completedAt: Date) {
  const locationId = adjustmentLocation(operation);
  await requireLocation(db, locationId, "Adjustment");
  await assertLines(db, operation.type, operation.items);

  const seen = new Set<string>();
  for (const item of operation.items) {
    if (seen.has(item.productId)) {
      throw new ApiError(
        400,
        "INVALID_ADJUSTMENT",
        "An adjustment can count each product only once at a location.",
      );
    }
    seen.add(item.productId);
  }

  await lockStockPairs(
    db,
    operation.items.map((item) => ({ productId: item.productId, locationId })),
  );

  for (const item of operation.items) {
    const recorded = await getAvailableStock(db, item.productId, locationId);
    const difference = item.requestedQuantity.minus(recorded);

    if (difference.isZero()) {
      throw new ApiError(
        400,
        "INVALID_ADJUSTMENT",
        "Counted quantity matches the recorded quantity.",
      );
    }

    if (difference.greaterThan(0)) {
      await increaseStock(db, item.productId, locationId, difference);
      await createStockMove(db, {
        operationId: operation.id,
        productId: item.productId,
        quantity: difference,
        movementType: "ADJUSTMENT",
        destinationLocationId: locationId,
        completedAt,
      });
    } else {
      const removed = difference.abs();
      await decreaseStock(db, item.productId, locationId, removed);
      await createStockMove(db, {
        operationId: operation.id,
        productId: item.productId,
        quantity: removed,
        movementType: "ADJUSTMENT",
        sourceLocationId: locationId,
        completedAt,
      });
    }

    await db.stockOperationItem.update({
      where: { id: item.id },
      data: { processedQuantity: difference.abs() },
    });
  }
}

function adjustmentLocation(operation: StockOperation) {
  const source = operation.sourceLocationId;
  const destination = operation.destinationLocationId;

  if (source && destination) {
    throw new ApiError(
      400,
      "INVALID_ADJUSTMENT",
      "An adjustment uses one location, not a source and a destination.",
    );
  }

  const locationId = destination ?? source;

  if (!locationId) {
    throw new ApiError(400, "INVALID_ADJUSTMENT", "An adjustment requires a location.");
  }

  return locationId;
}

async function requireLocation(db: Db, locationId: string | null, label: string) {
  if (!locationId) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} location is required.`);
  }

  const location = await db.location.findUnique({ where: { id: locationId } });

  if (!location) {
    throw new ApiError(404, "NOT_FOUND", `${label} location was not found.`);
  }

  if (!location.isActive) {
    throw new ApiError(409, "INACTIVE_LOCATION", `${label} location is inactive.`);
  }

  return location.id;
}

async function assertLines(db: Db, type: StockOperation["type"], items: Item[]) {
  for (const item of items) {
    if (type === "ADJUSTMENT") {
      if (item.requestedQuantity.isNegative()) {
        throw new ApiError(400, "VALIDATION_ERROR", "Counted quantity cannot be negative.");
      }
    } else if (item.requestedQuantity.lessThanOrEqualTo(0)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Quantity must be greater than zero.");
    }

    const product = await db.product.findUnique({ where: { id: item.productId } });

    if (!product) {
      throw new ApiError(404, "NOT_FOUND", "Product was not found.");
    }

    if (!product.isActive) {
      throw new ApiError(409, "INACTIVE_PRODUCT", "Product is inactive.");
    }
  }
}

function totalsByProduct(items: Item[]) {
  const totals = new Map<string, Prisma.Decimal>();

  for (const item of items) {
    const current = totals.get(item.productId) ?? new Prisma.Decimal(0);
    totals.set(item.productId, current.plus(item.requestedQuantity));
  }

  return totals;
}

function markProcessed(db: Db, item: Item) {
  return db.stockOperationItem.update({
    where: { id: item.id },
    data: { processedQuantity: item.requestedQuantity },
  });
}
