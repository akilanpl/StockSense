export type DeliveryItem = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  requestedQuantity: string;
  processedQuantity: string;
};

export type DeliveryOperation = {
  id: string;
  reference: string;
  type: "DELIVERY";
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  partnerId: string | null;
  partnerName: string | null;
  sourceLocationId: string | null;
  sourceLocationCode: string | null;
  destinationLocationId: string | null;
  destinationLocationCode: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  canceledAt: string | null;
  items: DeliveryItem[];
};

export type LocationOption = {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  isActive: boolean;
};

export type ProductOption = {
  id: string;
  sku: string;
  name: string;
  unitOfMeasureCode?: string;
  isActive: boolean;
};

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
