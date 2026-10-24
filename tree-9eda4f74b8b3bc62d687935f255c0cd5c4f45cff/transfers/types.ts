import type { Location, OperationStatus, Product, StockOperation } from "@/types/api";

export type TransferOperation = StockOperation;

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

export function formatLocation(code: string | null | undefined, fallback = "—") {
  return code?.trim() || fallback;
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
