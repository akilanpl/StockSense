import "dotenv/config";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unit = await prisma.unitOfMeasure.upsert({
    where: { code: "DEV-PCS" },
    update: {},
    create: { code: "DEV-PCS", name: "DEV Piece" },
  });

  const category = await prisma.category.upsert({
    where: { name: "DEV Components" },
    update: {},
    create: {
      name: "DEV Components",
      description: "Development category. Not production data.",
    },
  });

  await prisma.product.upsert({
    where: { sku: "DEV-WIDGET" },
    update: {},
    create: {
      name: "DEV Widget",
      sku: "DEV-WIDGET",
      categoryId: category.id,
      unitOfMeasureId: unit.id,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "DEV-WH" },
    update: {},
    create: {
      name: "DEV Main Warehouse",
      code: "DEV-WH",
      address: "Development warehouse",
    },
  });

  const stock = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouse.id, code: "DEV-STOCK" } },
    update: {},
    create: {
      warehouseId: warehouse.id,
      name: "DEV Stock",
      code: "DEV-STOCK",
      type: "INTERNAL",
    },
  });

  await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouse.id, code: "DEV-A" } },
    update: {},
    create: {
      warehouseId: warehouse.id,
      parentId: stock.id,
      name: "DEV Rack A",
      code: "DEV-A",
      type: "INTERNAL",
    },
  });

  await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouse.id, code: "DEV-B" } },
    update: {},
    create: {
      warehouseId: warehouse.id,
      parentId: stock.id,
      name: "DEV Rack B",
      code: "DEV-B",
      type: "INTERNAL",
    },
  });

  await prisma.partner.upsert({
    where: { id: "00000000-0000-4000-8000-0000000000a1" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-0000000000a1",
      name: "DEV Supplier",
      type: "SUPPLIER",
      email: "dev.supplier@stocksense.local",
    },
  });

  await prisma.partner.upsert({
    where: { id: "00000000-0000-4000-8000-0000000000a2" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-0000000000a2",
      name: "DEV Customer",
      type: "CUSTOMER",
      email: "dev.customer@stocksense.local",
    },
  });

  await prisma.user.upsert({
    where: { email: "dev.manager@stocksense.local" },
    update: {},
    create: {
      name: "DEV Inventory Manager",
      email: "dev.manager@stocksense.local",
      passwordHash: "dev-not-a-real-password-hash",
      role: UserRole.INVENTORY_MANAGER,
    },
  });
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
