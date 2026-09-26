import { ApiError } from "@/server/api/errors";
import { serializeWarehouse } from "@/server/catalog/serialize";
import { getPrisma } from "@/server/db/prisma";

export async function listWarehouses() {
  const warehouses = await getPrisma().warehouse.findMany({ orderBy: { code: "asc" } });
  return warehouses.map(serializeWarehouse);
}

export async function createWarehouse(input: {
  name: string;
  code: string;
  address?: string | null;
  isActive?: boolean;
}) {
  const warehouse = await getPrisma().warehouse.create({
    data: {
      name: input.name,
      code: input.code,
      address: input.address ?? null,
      isActive: input.isActive ?? true,
    },
  });

  return serializeWarehouse(warehouse);
}

export async function requireActiveWarehouse(id: string) {
  const warehouse = await getPrisma().warehouse.findUnique({ where: { id } });

  if (!warehouse) {
    throw new ApiError(404, "NOT_FOUND", "Warehouse was not found.");
  }

  if (!warehouse.isActive) {
    throw new ApiError(409, "INACTIVE_WAREHOUSE", "Warehouse is inactive.");
  }

  return warehouse;
}
