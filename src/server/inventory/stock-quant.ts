import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";

type Db = Prisma.TransactionClient;

export async function lockStock(db: Db, productId: string, locationId: string) {
  await db.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${productId}), hashtext(${locationId}))
  `;
}

export async function lockStockPairs(
  db: Db,
  pairs: Array<{ productId: string; locationId: string }>,
) {
  const unique = new Map<string, { productId: string; locationId: string }>();

  for (const pair of pairs) {
    unique.set(`${pair.productId}:${pair.locationId}`, pair);
  }

  const ordered = [...unique.values()].sort((left, right) => {
    const byProduct = left.productId.localeCompare(right.productId);
    return byProduct === 0 ? left.locationId.localeCompare(right.locationId) : byProduct;
  });

  for (const pair of ordered) {
    await lockStock(db, pair.productId, pair.locationId);
  }
}

export async function getAvailableStock(db: Db, productId: string, locationId: string) {
  const quant = await db.stockQuant.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });

  return quant?.quantity ?? new Prisma.Decimal(0);
}

export async function getOrCreateStockQuant(db: Db, productId: string, locationId: string) {
  await lockStock(db, productId, locationId);

  const existing = await db.stockQuant.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });

  if (existing) {
    return existing;
  }

  return db.stockQuant.create({
    data: {
      productId,
      locationId,
      quantity: new Prisma.Decimal(0),
    },
  });
}

export async function increaseStock(
  db: Db,
  productId: string,
  locationId: string,
  amount: Prisma.Decimal,
) {
  const quant = await getOrCreateStockQuant(db, productId, locationId);
  const quantity = quant.quantity.plus(amount);

  return db.stockQuant.update({
    where: { id: quant.id },
    data: { quantity },
  });
}

export async function decreaseStock(
  db: Db,
  productId: string,
  locationId: string,
  amount: Prisma.Decimal,
) {
  await lockStock(db, productId, locationId);
  const available = await getAvailableStock(db, productId, locationId);

  if (available.lessThan(amount)) {
    throw new ApiError(
      409,
      "INSUFFICIENT_STOCK",
      `Not enough stock to remove ${amount.toString()}. Available quantity is ${available.toString()}.`,
    );
  }

  const quantity = available.minus(amount);

  if (quantity.isNegative()) {
    throw new ApiError(409, "INSUFFICIENT_STOCK", "Stock cannot become negative.");
  }

  return db.stockQuant.update({
    where: { productId_locationId: { productId, locationId } },
    data: { quantity },
  });
}
