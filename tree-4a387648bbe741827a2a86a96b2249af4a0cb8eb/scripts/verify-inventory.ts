import "dotenv/config";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { createLocation, updateLocation } from "../src/server/catalog/locations";
import {
  addOperationItem,
  cancelOperation,
  createOperation,
  markOperationReady,
  updateOperation,
  validateOperation,
} from "../src/server/operations/operations";
import { ApiError } from "../src/server/api/errors";

const prisma = new PrismaClient();

async function main() {
  const stamp = Date.now().toString(36);
  const unit = await prisma.unitOfMeasure.create({
    data: { code: `VERIFY-PCS-${stamp}`, name: "Verify piece" },
  });
  const category = await prisma.category.create({
    data: { name: `VERIFY Category ${stamp}` },
  });
  const user = await prisma.user.create({
    data: {
      name: "Verify User",
      email: `verify.${stamp}@stocksense.local`,
      passwordHash: "verify-not-a-real-password-hash",
      role: "WAREHOUSE_STAFF",
    },
  });
  const warehouse = await prisma.warehouse.create({
    data: { name: "Verify Warehouse", code: `VERIFY-WH-${stamp}` },
  });
  const locationA = await prisma.location.create({
    data: { warehouseId: warehouse.id, name: "Verify A", code: "VERIFY-A" },
  });
  const locationB = await prisma.location.create({
    data: { warehouseId: warehouse.id, name: "Verify B", code: "VERIFY-B" },
  });
  const product = await prisma.product.create({
    data: {
      name: "Verify Widget",
      sku: `VERIFY-SKU-${stamp}`,
      categoryId: category.id,
      unitOfMeasureId: unit.id,
    },
  });

  const receipt = await createOperation({
    type: "RECEIPT",
    createdById: user.id,
    destinationLocationId: locationA.id,
    items: [{ productId: product.id, quantity: "100" }],
  });
  await updateOperation(receipt.id, { status: "READY" });
  await validateOperation(receipt.id);
  await expectQty(product.id, locationA.id, "100", "A receipt");

  const delivery = await createOperation({
    type: "DELIVERY",
    createdById: user.id,
    sourceLocationId: locationA.id,
    items: [{ productId: product.id, quantity: "20" }],
  });
  await updateOperation(delivery.id, { status: "READY" });
  await validateOperation(delivery.id);
  await expectQty(product.id, locationA.id, "80", "B delivery");

  const failed = await createOperation({
    type: "DELIVERY",
    createdById: user.id,
    sourceLocationId: locationA.id,
    items: [{ productId: product.id, quantity: "100" }],
  });
  await updateOperation(failed.id, { status: "READY" });
  await expectReject(async () => validateOperation(failed.id), "INSUFFICIENT_STOCK");
  await expectQty(product.id, locationA.id, "80", "C rejected delivery");
  const failedRecord = await prisma.stockOperation.findUniqueOrThrow({ where: { id: failed.id } });
  assert(failedRecord.status === "READY", "C rejected delivery must stay READY");
  const failedMoves = await prisma.stockMove.count({ where: { operationId: failed.id } });
  assert(failedMoves === 0, "C rejected delivery must not write moves");

  const transfer = await createOperation({
    type: "TRANSFER",
    createdById: user.id,
    sourceLocationId: locationA.id,
    destinationLocationId: locationB.id,
    items: [{ productId: product.id, quantity: "30" }],
  });
  await updateOperation(transfer.id, { status: "READY" });
  await validateOperation(transfer.id);
  await expectQty(product.id, locationA.id, "50", "D source");
  await expectQty(product.id, locationB.id, "30", "D destination");
  const total = (await qty(product.id, locationA.id)).plus(await qty(product.id, locationB.id));
  assert(total.equals(80), "D transfer must preserve total quantity");

  const counted = await prisma.product.create({
    data: {
      name: "Verify Count",
      sku: `VERIFY-COUNT-${stamp}`,
      categoryId: category.id,
      unitOfMeasureId: unit.id,
    },
  });
  const countedReceipt = await createOperation({
    type: "RECEIPT",
    createdById: user.id,
    destinationLocationId: locationA.id,
    items: [{ productId: counted.id, quantity: "80" }],
  });
  await updateOperation(countedReceipt.id, { status: "READY" });
  await validateOperation(countedReceipt.id);
  const adjustment = await createOperation({
    type: "ADJUSTMENT",
    createdById: user.id,
    destinationLocationId: locationA.id,
    items: [{ productId: counted.id, quantity: "77" }],
  });
  await updateOperation(adjustment.id, { status: "READY" });
  await validateOperation(adjustment.id);
  await expectQty(counted.id, locationA.id, "77", "E adjustment");

  const zeroProduct = await prisma.product.create({
    data: {
      name: "Verify Zero Count",
      sku: `VERIFY-ZERO-${stamp}`,
      categoryId: category.id,
      unitOfMeasureId: unit.id,
    },
  });
  const zeroReceipt = await createOperation({
    type: "RECEIPT",
    createdById: user.id,
    destinationLocationId: locationB.id,
    items: [{ productId: zeroProduct.id, quantity: "12" }],
  });
  await markOperationReady(zeroReceipt.id);
  await validateOperation(zeroReceipt.id);
  const zeroCount = await createOperation({
    type: "ADJUSTMENT",
    createdById: user.id,
    destinationLocationId: locationB.id,
    items: [{ productId: zeroProduct.id, quantity: "0" }],
  });
  await markOperationReady(zeroCount.id);
  const zeroDone = await validateOperation(zeroCount.id);
  await expectQty(zeroProduct.id, locationB.id, "0", "zero adjustment");
  assert(zeroDone.status === "DONE", "zero adjustment must complete");
  const zeroMove = await prisma.stockMove.findFirstOrThrow({
    where: { operationId: zeroCount.id, movementType: "ADJUSTMENT" },
  });
  assert(zeroMove.quantity.equals("12"), "zero adjustment move must record the removed quantity");
  await expectReject(
    async () =>
      createOperation({
        type: "RECEIPT",
        createdById: user.id,
        destinationLocationId: locationB.id,
        items: [{ productId: zeroProduct.id, quantity: "0" }],
      }),
    "VALIDATION_ERROR",
  );

  const partial = await createOperation({
    type: "DELIVERY",
    createdById: user.id,
    sourceLocationId: locationA.id,
    items: [{ productId: product.id, quantity: "40" }],
  });
  await addOperationItem(partial.id, { productId: product.id, quantity: "20" });
  await updateOperation(partial.id, { status: "READY" });
  await expectReject(async () => validateOperation(partial.id), "INSUFFICIENT_STOCK");
  await expectQty(product.id, locationA.id, "50", "H partial delivery");

  await expectReject(async () => validateOperation(receipt.id), "INVALID_STATE");

  const lifecycleProduct = await prisma.product.create({
    data: {
      name: "Verify Lifecycle",
      sku: `VERIFY-LIFE-${stamp}`,
      categoryId: category.id,
      unitOfMeasureId: unit.id,
    },
  });
  const lifecycle = await createOperation({
    type: "RECEIPT",
    createdById: user.id,
    destinationLocationId: locationB.id,
    items: [{ productId: lifecycleProduct.id, quantity: "1" }],
  });
  await expectReject(async () => validateOperation(lifecycle.id), "INVALID_STATE");
  const ready = await markOperationReady(lifecycle.id);
  assert(ready.status === "READY", "DRAFT -> READY");
  const done = await validateOperation(lifecycle.id);
  assert(done.status === "DONE", "READY -> DONE");
  await expectReject(async () => markOperationReady(lifecycle.id), "INVALID_STATE");
  await expectReject(async () => validateOperation(lifecycle.id), "INVALID_STATE");
  const canceled = await createOperation({
    type: "RECEIPT",
    createdById: user.id,
    destinationLocationId: locationB.id,
    items: [{ productId: lifecycleProduct.id, quantity: "1" }],
  });
  await cancelOperation(canceled.id);
  await expectReject(async () => markOperationReady(canceled.id), "INVALID_STATE");

  const moves = await prisma.stockMove.findMany({
    where: { productId: { in: [product.id, counted.id] } },
    orderBy: { createdAt: "asc" },
  });
  const types = moves.map((move) => move.movementType);
  assert(types.includes("RECEIPT"), "F receipt move");
  assert(types.includes("DELIVERY"), "F delivery move");
  assert(types.includes("TRANSFER"), "F transfer move");
  assert(types.includes("ADJUSTMENT"), "F adjustment move");
  assert(
    moves.every((move) => move.completedAt !== null),
    "F completed moves keep a completion timestamp",
  );

  const child = await createLocation({
    warehouseId: warehouse.id,
    parentId: locationA.id,
    name: "Verify child",
    code: `VERIFY-C-${stamp}`,
  });
  await expectReject(
    async () => updateLocation(child.id, { parentId: child.id }),
    "INVALID_HIERARCHY",
  );
  await expectReject(
    async () => updateLocation(locationA.id, { parentId: child.id }),
    "INVALID_HIERARCHY",
  );
  const otherWarehouse = await prisma.warehouse.create({
    data: { name: "Verify Other", code: `VERIFY-WH2-${stamp}` },
  });
  const otherLocation = await prisma.location.create({
    data: { warehouseId: otherWarehouse.id, name: "Verify other", code: "VERIFY-X" },
  });
  await expectReject(
    async () => updateLocation(child.id, { parentId: otherLocation.id }),
    "INVALID_HIERARCHY",
  );

  console.log(`Verified ${moves.length} stock moves for ${product.sku} and ${counted.sku}.`);
}

async function qty(productId: string, locationId: string) {
  const quant = await prisma.stockQuant.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });
  return quant?.quantity ?? new Prisma.Decimal(0);
}

async function expectQty(productId: string, locationId: string, expected: string, label: string) {
  const actual = await qty(productId, locationId);
  assert(actual.equals(expected), `${label}: expected ${expected}, received ${actual.toString()}`);
}

async function expectReject(action: () => Promise<unknown>, code: string) {
  try {
    await action();
  } catch (error) {
    if (error instanceof ApiError && error.code === code) {
      return;
    }
    throw error;
  }

  throw new Error(`Expected ${code}`);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
