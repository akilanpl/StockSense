import type { Location, Product, StockOperation } from "@/types/api";

export type ReceiptOperation = StockOperation;
export type LocationOption = Pick<Location, "id" | "code" | "name" | "warehouseId" | "isActive" | "type">;
export type ProductOption = Pick<Product, "id" | "sku" | "name" | "isActive">;

export const SEEDED_SUPPLIER = {
  id: "00000000-0000-4000-8000-0000000000a1",
  name: "DEV Supplier",
};
