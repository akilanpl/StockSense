import type { LocationType } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { requireActiveWarehouse } from "@/server/catalog/warehouses";
import { serializeLocation } from "@/server/catalog/serialize";
import { getPrisma } from "@/server/db/prisma";

export async function listLocations(warehouseId?: string) {
  const locations = await getPrisma().location.findMany({
    where: warehouseId ? { warehouseId } : undefined,
    orderBy: [{ warehouseId: "asc" }, { code: "asc" }],
  });

  return locations.map(serializeLocation);
}

export async function createLocation(input: {
  warehouseId: string;
  parentId?: string | null;
  name: string;
  code: string;
  type?: LocationType;
  isActive?: boolean;
}) {
  await requireActiveWarehouse(input.warehouseId);
  await assertParent(null, input.parentId ?? null, input.warehouseId);

  const location = await getPrisma().location.create({
    data: {
      warehouseId: input.warehouseId,
      parentId: input.parentId ?? null,
      name: input.name,
      code: input.code,
      type: input.type ?? "INTERNAL",
      isActive: input.isActive ?? true,
    },
  });

  return serializeLocation(location);
}

export async function updateLocation(
  id: string,
  input: {
    parentId?: string | null;
    name?: string;
    code?: string;
    type?: LocationType;
    isActive?: boolean;
  },
) {
  const location = await getPrisma().location.findUnique({ where: { id } });

  if (!location) {
    throw new ApiError(404, "NOT_FOUND", "Location was not found.");
  }

  if (input.parentId !== undefined) {
    await assertParent(location.id, input.parentId, location.warehouseId);
  }

  const updated = await getPrisma().location.update({
    where: { id },
    data: {
      parentId: input.parentId,
      name: input.name,
      code: input.code,
      type: input.type,
      isActive: input.isActive,
    },
  });

  return serializeLocation(updated);
}

async function assertParent(locationId: string | null, parentId: string | null, warehouseId: string) {
  if (!parentId) {
    return;
  }

  if (locationId && parentId === locationId) {
    throw new ApiError(400, "INVALID_HIERARCHY", "A location cannot be its own parent.");
  }

  const seen = new Set<string>();
  let currentId: string | null = parentId;

  while (currentId) {
    if (locationId && currentId === locationId) {
      throw new ApiError(400, "INVALID_HIERARCHY", "This parent would create a location cycle.");
    }

    if (seen.has(currentId)) {
      throw new ApiError(400, "INVALID_HIERARCHY", "Location hierarchy already contains a cycle.");
    }

    seen.add(currentId);
    const current: { id: string; warehouseId: string; parentId: string | null; isActive: boolean } | null =
      await getPrisma().location.findUnique({
        where: { id: currentId },
        select: { id: true, warehouseId: true, parentId: true, isActive: true },
      });

    if (!current) {
      throw new ApiError(404, "NOT_FOUND", "Parent location was not found.");
    }

    if (current.warehouseId !== warehouseId) {
      throw new ApiError(
        400,
        "INVALID_HIERARCHY",
        "Parent location must belong to the same warehouse.",
      );
    }

    if (currentId === parentId && !current.isActive) {
      throw new ApiError(409, "INACTIVE_LOCATION", "Parent location is inactive.");
    }

    currentId = current.parentId;
  }
}
