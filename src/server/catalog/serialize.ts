import type { Category, Location, Product, UnitOfMeasure, Warehouse } from "@/generated/prisma/client";

export function serializeCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function serializeWarehouse(warehouse: Warehouse) {
  return {
    id: warehouse.id,
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    isActive: warehouse.isActive,
    createdAt: warehouse.createdAt.toISOString(),
    updatedAt: warehouse.updatedAt.toISOString(),
  };
}

export function serializeLocation(location: Location) {
  return {
    id: location.id,
    warehouseId: location.warehouseId,
    parentId: location.parentId,
    name: location.name,
    code: location.code,
    type: location.type,
    isActive: location.isActive,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };
}

export function serializeProduct(
  product: Product & { category: Category; unitOfMeasure: UnitOfMeasure },
) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    unitOfMeasureId: product.unitOfMeasureId,
    unitOfMeasureCode: product.unitOfMeasure.code,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
