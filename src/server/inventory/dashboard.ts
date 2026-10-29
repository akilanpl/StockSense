import { Prisma } from "@/generated/prisma/client";
import { decimalToString } from "@/server/inventory/decimal";
import { getPrisma } from "@/server/db/prisma";

const openStatuses = ["DRAFT", "WAITING", "READY"] as const;
const scheduledStatuses = ["WAITING", "READY"] as const;

export async function getDashboard() {
  const prisma = getPrisma();
  const [inStockGroups, zeroQuants, pendingReceipts, pendingDeliveries, scheduledTransfers, rules] =
    await Promise.all([
      prisma.stockQuant.groupBy({
        by: ["productId"],
        where: { quantity: { gt: 0 }, product: { isActive: true } },
      }),
      prisma.product.count({ where: { isActive: true, stockQuants: { none: { quantity: { gt: 0 } } } } }),
      prisma.stockOperation.count({
        where: { type: "RECEIPT", status: { in: [...openStatuses] } },
      }),
      prisma.stockOperation.count({
        where: { type: "DELIVERY", status: { in: [...openStatuses] } },
      }),
      prisma.stockOperation.count({
        where: { type: "TRANSFER", status: { in: [...scheduledStatuses] } },
      }),
      prisma.reorderRule.findMany({
        where: { isActive: true },
        include: {
          product: true,
          location: true,
        },
      }),
    ]);

  const lowStockItems = [];
  const quants = rules.length ? await prisma.stockQuant.findMany({
    where: { OR: rules.map((rule) => ({ productId: rule.productId, locationId: rule.locationId })) },
  }) : [];
  const quantityByPair = new Map(quants.map((quant) => [`${quant.productId}:${quant.locationId}`, quant.quantity]));

  for (const rule of rules) {
    if (!rule.product.isActive || !rule.location.isActive) continue;
    const quantity = quantityByPair.get(`${rule.productId}:${rule.locationId}`) ?? new Prisma.Decimal(0);

    if (quantity.greaterThan(0) && quantity.lessThanOrEqualTo(rule.minimumQuantity)) {
      lowStockItems.push({
        productId: rule.productId,
        sku: rule.product.sku,
        productName: rule.product.name,
        locationId: rule.locationId,
        locationCode: rule.location.code,
        quantity: decimalToString(quantity),
        minimumQuantity: decimalToString(rule.minimumQuantity),
      });
    }
  }

  return {
    totalProductsInStock: inStockGroups.length,
    lowStockCount: lowStockItems.length,
    outOfStockCount: zeroQuants,
    pendingReceipts,
    pendingDeliveries,
    scheduledInternalTransfers: scheduledTransfers,
    lowStockItems,
  };
}
