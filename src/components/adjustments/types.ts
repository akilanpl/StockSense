import type { Location, Product, StockOperation } from "@/types/api";

export type AdjustmentOperation = StockOperation;
export type LocationOption = Pick<Location, "id" | "code" | "name" | "warehouseId" | "isActive" | "type">;
export type ProductOption = Pick<Product, "id" | "sku" | "name" | "isActive">;
