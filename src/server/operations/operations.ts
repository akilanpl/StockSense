import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { quantityForOperation } from "@/server/inventory/decimal";
import { assertCanTransition, assertDraft } from "@/server/inventory/transitions";
import { validateOperationInTransaction } from "@/server/inventory/validate-operation";
import { getPrisma } from "@/server/db/prisma";
import { operationInclude } from "@/server/operations/include";
import { createOperationReference } from "@/server/operations/references";
import { serializeOperation } from "@/server/operations/serialize";

type OperationFilters = {
  type?: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  status?: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  sourceLocationId?: string;
  destinationLocationId?: string;
  warehouseId?: string;
  from?: string;
  to?: string;
};

export async function listOperations(filters: OperationFilters) {
  const operations = await getPrisma().stockOperation.findMany({
    where: operationWhere(filters),
    include: operationInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return operations.map(serializeOperation);
}

export async function getOperation(id: string) {
  const operation = await getPrisma().stockOperation.findUnique({
    where: { id },
    include: operationInclude,
  });

  if (!operation) {
    throw new ApiError(404, "NOT_FOUND", "Operation was not found.");
  }

  return serializeOperation(operation);
}

export async function createOperation(input: {
  type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  reference?: string;
  partnerId?: string | null;
  sourceLocationId?: string | null;
  destinationLocationId?: string | null;
  createdById: string;
  items?: Array<{ productId: string; quantity: string | number }>;
}) {
  await assertUser(input.createdById);
  await assertPartner(input.partnerId);
  await assertLocation(input.sourceLocationId);
  await assertLocation(input.destinationLocationId);

  const items = (input.items ?? []).map((item) => ({
    productId: item.productId,
    requestedQuantity: quantityForOperation(input.type, item.quantity),
  }));

  await assertProducts(items.map((item) => item.productId));

  const operation = await getPrisma().stockOperation.create({
    data: {
      type: input.type,
      reference: input.reference ?? createOperationReference(input.type),
      partnerId: input.partnerId ?? null,
      sourceLocationId: input.sourceLocationId ?? null,
      destinationLocationId: input.destinationLocationId ?? null,
      createdById: input.createdById,
      status: "DRAFT",
      items: {
        create: items,
      },
    },
    include: operationInclude,
  });

  return serializeOperation(operation);
}

export async function updateOperation(
  id: string,
  input: {
    reference?: string;
    partnerId?: string | null;
    sourceLocationId?: string | null;
    destinationLocationId?: string | null;
    status?: "WAITING" | "READY";
  },
) {
  const existing = await requireOperation(id);
  const editsHeader =
    input.reference !== undefined ||
    input.partnerId !== undefined ||
    input.sourceLocationId !== undefined ||
    input.destinationLocationId !== undefined;

  if (editsHeader) {
    assertDraft(existing.status, "edit");
  }

  if (input.status) {
    assertCanTransition(existing.status, input.status);
  }

  await assertPartner(input.partnerId);
  await assertLocation(input.sourceLocationId);
  await assertLocation(input.destinationLocationId);

  const nextStatus = input.status ?? existing.status;

  if (nextStatus === "READY") {
    assertReadyShape({
      type: existing.type,
      sourceLocationId:
        input.sourceLocationId !== undefined ? input.sourceLocationId : existing.sourceLocationId,
      destinationLocationId:
        input.destinationLocationId !== undefined
          ? input.destinationLocationId
          : existing.destinationLocationId,
      items: existing.items,
    });
  }

  const operation = await getPrisma().stockOperation.update({
    where: { id },
    data: {
      reference: input.reference,
      partnerId: input.partnerId,
      sourceLocationId: input.sourceLocationId,
      destinationLocationId: input.destinationLocationId,
      status: input.status,
    },
    include: operationInclude,
  });

  return serializeOperation(operation);
}

export async function cancelOperation(id: string) {
  const existing = await requireOperation(id);
  assertCanTransition(existing.status, "CANCELED");

  const operation = await getPrisma().stockOperation.update({
    where: { id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
    include: operationInclude,
  });

  return serializeOperation(operation);
}

export async function markOperationReady(id: string) {
  return updateOperation(id, { status: "READY" });
}

export async function validateOperation(id: string) {
  const operation = await getPrisma().$transaction(
    (tx) => validateOperationInTransaction(tx, id),
    { timeout: 20_000 },
  );

  return serializeOperation(operation);
}

export async function addOperationItem(
  operationId: string,
  input: { productId: string; quantity: string | number },
) {
  const operation = await requireOperation(operationId);
  assertDraft(operation.status, "add a line to");
  await assertProducts([input.productId]);

  await getPrisma().stockOperationItem.create({
    data: {
      operationId,
      productId: input.productId,
      requestedQuantity: quantityForOperation(operation.type, input.quantity),
    },
  });

  return getOperation(operationId);
}

export async function updateOperationItem(
  operationId: string,
  itemId: string,
  input: { productId?: string; quantity?: string | number },
) {
  const operation = await requireOperation(operationId);
  assertDraft(operation.status, "edit a line on");
  const item = operation.items.find((line) => line.id === itemId);

  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "Operation line was not found.");
  }

  if (input.productId) {
    await assertProducts([input.productId]);
  }

  await getPrisma().stockOperationItem.update({
    where: { id: itemId },
    data: {
      productId: input.productId,
      requestedQuantity:
        input.quantity === undefined ? undefined : quantityForOperation(operation.type, input.quantity),
      processedQuantity: 0,
    },
  });

  return getOperation(operationId);
}

export async function removeOperationItem(operationId: string, itemId: string) {
  const operation = await requireOperation(operationId);
  assertDraft(operation.status, "remove a line from");
  const item = operation.items.find((line) => line.id === itemId);

  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "Operation line was not found.");
  }

  await getPrisma().stockOperationItem.delete({ where: { id: itemId } });
  return getOperation(operationId);
}

function assertReadyShape(operation: {
  type: string;
  sourceLocationId: string | null;
  destinationLocationId: string | null;
  items: unknown[];
}) {
  if (operation.items.length === 0) {
    throw new ApiError(409, "MISSING_ITEMS", "Add at least one product line before marking ready.");
  }

  if (operation.type === "RECEIPT" && !operation.destinationLocationId) {
    throw new ApiError(400, "VALIDATION_ERROR", "A receipt needs a destination location.");
  }

  if (operation.type === "DELIVERY" && !operation.sourceLocationId) {
    throw new ApiError(400, "VALIDATION_ERROR", "A delivery needs a source location.");
  }

  if (operation.type === "TRANSFER") {
    if (!operation.sourceLocationId || !operation.destinationLocationId) {
      throw new ApiError(400, "VALIDATION_ERROR", "A transfer needs a source and a destination.");
    }

    if (operation.sourceLocationId === operation.destinationLocationId) {
      throw new ApiError(400, "VALIDATION_ERROR", "Transfer source and destination must differ.");
    }
  }

  if (operation.type === "ADJUSTMENT") {
    const locations = [operation.sourceLocationId, operation.destinationLocationId].filter(Boolean);
    if (locations.length !== 1) {
      throw new ApiError(400, "INVALID_ADJUSTMENT", "An adjustment requires exactly one location.");
    }
  }
}

async function requireOperation(id: string) {
  const operation = await getPrisma().stockOperation.findUnique({
    where: { id },
    include: operationInclude,
  });

  if (!operation) {
    throw new ApiError(404, "NOT_FOUND", "Operation was not found.");
  }

  return operation;
}

async function assertUser(id: string) {
  const user = await getPrisma().user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User was not found.");
  }
}

async function assertPartner(id: string | null | undefined) {
  if (!id) {
    return;
  }

  const partner = await getPrisma().partner.findUnique({ where: { id } });
  if (!partner) {
    throw new ApiError(404, "NOT_FOUND", "Partner was not found.");
  }
}

async function assertLocation(id: string | null | undefined) {
  if (!id) {
    return;
  }

  const location = await getPrisma().location.findUnique({ where: { id } });
  if (!location) {
    throw new ApiError(404, "NOT_FOUND", "Location was not found.");
  }

  if (!location.isActive) {
    throw new ApiError(409, "INACTIVE_LOCATION", "Location is inactive.");
  }
}

async function assertProducts(ids: string[]) {
  const products = await getPrisma().product.findMany({ where: { id: { in: ids } } });
  const found = new Set(products.map((product) => product.id));

  for (const id of ids) {
    if (!found.has(id)) {
      throw new ApiError(404, "NOT_FOUND", "Product was not found.");
    }
  }

  if (products.some((product) => !product.isActive)) {
    throw new ApiError(409, "INACTIVE_PRODUCT", "Product is inactive.");
  }
}

function operationWhere(filters: OperationFilters): Prisma.StockOperationWhereInput {
  return {
    type: filters.type,
    status: filters.status,
    sourceLocationId: filters.sourceLocationId,
    destinationLocationId: filters.destinationLocationId,
    createdAt: dateRange(filters.from, filters.to),
    OR: filters.warehouseId
      ? [
          { sourceLocation: { warehouseId: filters.warehouseId } },
          { destinationLocation: { warehouseId: filters.warehouseId } },
        ]
      : undefined,
  };
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
