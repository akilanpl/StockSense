import { recordFailedLoginAttempt } from "../src/server/auth/login-limit";
import "dotenv/config";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "../src/generated/prisma/client";
import { createOperation, cancelOperation, addOperationItem, markOperationReady, validateOperation } from "../src/server/operations/operations";
import { validateOperationInTransaction } from "../src/server/inventory/validate-operation";
import { consumeVerificationCode, issueVerificationCode } from "../src/server/auth/otp";
import { hashPassword } from "../src/server/auth/password";
import { quantityForOperation } from "../src/server/inventory/decimal";
import { getDashboard } from "../src/server/inventory/dashboard";
import { ApiError } from "../src/server/api/errors";

const db = new PrismaClient();
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((r) => { release = r; });
  return { promise, release };
}
async function routes(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) result.push(...await routes(path));
    else if (item.name === "route.ts") result.push(path);
  }
  return result;
}

async function main() {
  const database = new URL(process.env.DATABASE_URL ?? "").pathname;
  assert(/(?:^|[_-])(test|review)(?:[_-]|$)/i.test(database), "Use a dedicated database named with _test_ or _review_; never a production database.");
  let guarded = 0;
  for (const path of await routes(resolve("src/app/api"))) {
    if (path.includes("/api/auth/")) continue;
    const handlers = await import(pathToFileURL(path).href);
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      if (!handlers[method]) continue;
      const response = await handlers[method](new Request("http://localhost/api/test", { method }), {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001", itemId: "00000000-0000-4000-8000-000000000002" }),
      });
      assert.equal(response.status, 401, `${method} ${path} must reject anonymous access`);
      guarded++;
    }
  }
  console.log(`PASS: all ${guarded} inventory/catalog API handlers reject anonymous access.`);
  const { POST: createProduct } = await import("../src/app/api/products/route");
  assert.equal((await createProduct(new Request("http://localhost/api/products", { method: "POST", headers: { origin: "https://untrusted.example" } }), {} as never)).status, 403);

  const stamp = Date.now().toString(36);
  const user = await db.user.create({ data: { name: "Integration", email: `integration-${stamp}@example.test`, passwordHash: hashPassword("test-only-password"), emailVerifiedAt: new Date(), role: "INVENTORY_MANAGER" } });
  const warehouse = await db.warehouse.create({ data: { name: "Integration", code: `INT-${stamp}` } });
  const location = await db.location.create({ data: { warehouseId: warehouse.id, code: "A", name: "A" } });
  const unit = await db.unitOfMeasure.create({ data: { code: `INT-${stamp}`, name: "Piece" } });
  const category = await db.category.create({ data: { name: `INT-${stamp}` } });
  const product = await db.product.create({ data: { sku: `INT-${stamp}`, name: "Integration", categoryId: category.id, unitOfMeasureId: unit.id } });
  const receipt = () => createOperation({ type: "RECEIPT", createdById: user.id, destinationLocationId: location.id, items: [{ productId: product.id, quantity: "10" }] });

  // Deterministic schedule: validation holds the parent row while cancellation starts.
  const operation = await receipt(); await markOperationReady(operation.id);
  const locked = barrier(), release = barrier();
  const validation = db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stock_operations WHERE id = CAST(${operation.id} AS uuid) FOR UPDATE`;
    locked.release(); await release.promise;
    return validateOperationInTransaction(tx, operation.id);
  }, { timeout: 20_000 });
  await locked.promise;
  const cancellation = cancelOperation(operation.id).then(() => null, (error: unknown) => error);
  await pause(100); release.release(); await validation;
  assert((await cancellation) instanceof ApiError);
  const saved = await db.stockOperation.findUniqueOrThrow({ where: { id: operation.id } });
  assert.equal(saved.status, "DONE"); assert.equal(await db.stockMove.count({ where: { operationId: operation.id } }), 1);
  console.log("PASS: validation wins over a queued cancellation; posted ledger cannot become canceled.");

  // Opposite order: cancellation commits while validation waits.
  const canceled = await receipt(); await markOperationReady(canceled.id);
  const cancelLocked = barrier(), cancelRelease = barrier();
  const cancelFirst = db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stock_operations WHERE id = CAST(${canceled.id} AS uuid) FOR UPDATE`;
    cancelLocked.release(); await cancelRelease.promise;
    await tx.stockOperation.update({ where: { id: canceled.id }, data: { status: "CANCELED", canceledAt: new Date() } });
  });
  await cancelLocked.promise;
  const validateSecond = validateOperation(canceled.id).then(() => null, (error: unknown) => error);
  await pause(100); cancelRelease.release(); await cancelFirst;
  assert((await validateSecond) instanceof ApiError);
  assert.equal(await db.stockMove.count({ where: { operationId: canceled.id } }), 0);

  const draft = await receipt();
  const readyLocked = barrier(), readyRelease = barrier();
  const readyFirst = db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM stock_operations WHERE id = CAST(${draft.id} AS uuid) FOR UPDATE`;
    readyLocked.release(); await readyRelease.promise;
    await tx.stockOperation.update({ where: { id: draft.id }, data: { status: "READY" } });
  });
  await readyLocked.promise;
  const addSecond = addOperationItem(draft.id, { productId: product.id, quantity: "2" }).then(() => null, (error: unknown) => error);
  await pause(100); readyRelease.release(); await readyFirst;
  assert((await addSecond) instanceof ApiError);
  assert.equal(await db.stockOperationItem.count({ where: { operationId: draft.id } }), 1);
  console.log("PASS: canceled operations cannot post and queued draft edits cannot change ready operations.");

  const noChange = await createOperation({ type: "ADJUSTMENT", createdById: user.id, destinationLocationId: location.id, items: [{ productId: product.id, quantity: "10" }] });
  await markOperationReady(noChange.id); const done = await validateOperation(noChange.id);
  assert.equal(done.status, "DONE"); assert.equal(done.items[0].processedQuantity, "0");
  assert.equal(await db.stockMove.count({ where: { operationId: noChange.id } }), 0);
  assert.throws(() => quantityForOperation("RECEIPT", "100000000000000"), ApiError);
  console.log("PASS: unchanged physical counts complete without a fake movement; quantities respect database precision.");

  const sales = await Promise.all([1, 2].map(() => createOperation({ type: "DELIVERY", createdById: user.id, sourceLocationId: location.id, items: [{ productId: product.id, quantity: "6" }] })));
  await Promise.all(sales.map((sale) => markOperationReady(sale.id)));
  const salesResults = await Promise.allSettled(sales.map((sale) => validateOperation(sale.id)));
  assert.equal(salesResults.filter((result) => result.status === "fulfilled").length, 1);
  assert((await db.stockQuant.findUniqueOrThrow({ where: { productId_locationId: { productId: product.id, locationId: location.id } } })).quantity.equals("4"));
  console.log("PASS: concurrent deliveries cannot oversell the same product/location.");

  const code = await issueVerificationCode(user.id, "PASSWORD_RESET");
  const consumption = await Promise.allSettled([consumeVerificationCode(user.id, code, "PASSWORD_RESET"), consumeVerificationCode(user.id, code, "PASSWORD_RESET")]);
  assert.equal(consumption.filter((r) => r.status === "fulfilled").length, 1);
  await db.emailVerificationCode.updateMany({ where: { userId: user.id }, data: { createdAt: new Date(Date.now() - 61_000) } });
  await issueVerificationCode(user.id, "PASSWORD_RESET");
  await db.emailVerificationCode.updateMany({ where: { userId: user.id, usedAt: null }, data: { codeHash: hashPassword("123456") } });
  await Promise.allSettled(Array.from({ length: 7 }, () => consumeVerificationCode(user.id, "999999", "PASSWORD_RESET")));
  const attempts = await db.emailVerificationCode.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  assert.equal(attempts.attempts, 5); assert(attempts.usedAt);
  console.log("PASS: parallel OTP reuse succeeds once and concurrent failures stop at five attempts.");
  const rateResults = await Promise.allSettled(Array.from({ length: 22 }, () => recordFailedLoginAttempt(`rate-${stamp}@example.test`)));
  assert.equal(rateResults.filter((r) => r.status === "fulfilled").length, 20);
  console.log("PASS: shared login throttling atomically limits parallel requests to 20 per 15-minute window.");
  const dashboard = await getDashboard();
  const expectedEmpty = await db.product.count({ where: { isActive: true, stockQuants: { none: { quantity: { gt: 0 } } } } });
  assert.equal(dashboard.outOfStockCount, expectedEmpty);
  console.log("PASS: dashboard includes active products that have never received stock.");
}
main().finally(() => db.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
