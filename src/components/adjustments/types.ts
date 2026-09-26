import type { Location, OperationStatus, Product, StockOperation } from "@/types/api";

export type AdjustmentOperation = StockOperation;

export type LocationOption = Pick<Location, "id" | "code" | "name" | "warehouseId" | "isActive">;
export type ProductOption = Pick<Product, "id" | "sku" | "name" | "unitOfMeasureCode" | "isActive">;

export function getStatusBadgeProps(status: string): {
  label: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
} {
  switch (status.toUpperCase()) {
    case "DRAFT":
      return { label: "Draft", tone: "neutral" };
    case "WAITING":
      return { label: "Waiting", tone: "warning" };
    case "READY":
      return { label: "Ready", tone: "info" };
    case "DONE":
      return { label: "Done", tone: "success" };
    case "CANCELED":
    case "CANCELLED":
      return { label: "Cancelled", tone: "danger" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function adjustmentLocationId(operation: AdjustmentOperation) {
  return operation.destinationLocationId ?? operation.sourceLocationId;
}

export function adjustmentLocationCode(operation: AdjustmentOperation) {
  return operation.destinationLocationCode ?? operation.sourceLocationCode ?? "—";
}

export function stockKey(productId: string, locationId: string) {
  return `${productId}:${locationId}`;
}

export function parseQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatQuantity(value: string | number | null | undefined, fallback = "0") {
  const parsed = parseQuantity(value);
  if (parsed === null) return fallback;
  return String(parsed);
}

export function formatDifference(counted: string | number | null | undefined, system: string | number | null | undefined) {
  const countedQty = parseQuantity(counted);
  const systemQty = parseQuantity(system) ?? 0;

  if (countedQty === null) return "—";

  const difference = countedQty - systemQty;
  if (Object.is(difference, -0) || difference === 0) {
    return "0";
  }

  return difference > 0 ? `+${difference}` : String(difference);
}

export function canMarkReady(status: OperationStatus) {
  return status === "DRAFT" || status === "WAITING";
}

export function canValidate(status: OperationStatus) {
  return status === "READY";
}

export function isClosed(status: OperationStatus) {
  return status === "DONE" || status === "CANCELED";
}
