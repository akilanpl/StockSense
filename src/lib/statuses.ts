import type { StatusLegendItem } from "@/types";

export const operationStatuses: StatusLegendItem[] = [
  { label: "Draft", tone: "neutral" },
  { label: "Waiting", tone: "warning" },
  { label: "Ready", tone: "info" },
  { label: "Done", tone: "success" },
  { label: "Cancelled", tone: "danger" },
];

export const stockStatuses: StatusLegendItem[] = [
  { label: "In stock", tone: "success" },
  { label: "Low stock", tone: "warning" },
  { label: "Out of stock", tone: "danger" },
];
