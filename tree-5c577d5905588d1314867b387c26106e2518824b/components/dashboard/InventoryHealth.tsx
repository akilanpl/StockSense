import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { columns } from "@/lib/columns";
import type { LowStockItem, StockQuant } from "@/types/api";
import type { StatusTone } from "@/types";

type HealthRow = {
  id: string;
  severity: string;
  tone: StatusTone;
  product: string;
  sku: string;
  location: string;
  onHand: string;
  minimum: string;
  suggested: string;
  rank: number;
};

export function InventoryHealth({
  lowStockItems,
  stock,
}: {
  lowStockItems: LowStockItem[];
  stock: StockQuant[];
}) {
  const rows: HealthRow[] = [
    ...lowStockItems.map((item) => {
      const tone = severityTone(item.quantity, item.minimumQuantity);
      return {
        id: `low-${item.productId}-${item.locationId}`,
        severity: tone.label,
        tone: tone.tone,
        product: item.productName,
        sku: item.sku,
        location: item.locationCode,
        onHand: item.quantity,
        minimum: item.minimumQuantity,
        suggested: shortfall(item.quantity, item.minimumQuantity),
        rank: tone.rank,
      };
    }),
    ...stock
      .filter((row) => Number(row.quantity) === 0)
      .map((row) => ({
        id: `out-${row.id}`,
        severity: "Out of stock",
        tone: "danger" as const,
        product: row.productName,
        sku: row.sku,
        location: row.locationCode,
        onHand: row.quantity,
        minimum: "—",
        suggested: "Replenish",
        rank: 0,
      })),
  ]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 12);

  return (
    <Card>
      <div className="border-b border-border px-3 py-3">
        <h2 className="text-sm font-semibold">Inventory health</h2>
        <p className="mt-1 text-xs text-muted">
          Reorder suggestions use active minimum quantities. Out-of-stock rows have no invented minimum.
        </p>
      </div>
      <DataTable
        columns={columns("Severity", "Product", "SKU", "Location", "On hand", "Minimum", "Suggested reorder")}
        rows={rows.map((row) => ({
          id: row.id,
          cells: [
            <StatusBadge key={row.id} label={row.severity} tone={row.tone} />,
            row.product,
            row.sku,
            row.location,
            row.onHand,
            row.minimum,
            row.suggested,
          ],
        }))}
        emptyTitle="No replenishment alerts"
        emptyDescription="Items at or below a reorder minimum, and zero-quantity rows, appear here."
      />
    </Card>
  );
}

function severityTone(quantity: string, minimum: string) {
  const onHand = Number(quantity);
  const floor = Number(minimum);
  if (!Number.isFinite(onHand) || !Number.isFinite(floor) || floor <= 0) {
    return { label: "Review", tone: "neutral" as const, rank: 3 };
  }
  const ratio = onHand / floor;
  if (ratio <= 0.25) return { label: "Critical", tone: "danger" as const, rank: 1 };
  if (ratio <= 0.5) return { label: "High", tone: "warning" as const, rank: 2 };
  return { label: "Watch", tone: "info" as const, rank: 3 };
}

function shortfall(quantity: string, minimum: string) {
  const gap = Number(minimum) - Number(quantity);
  if (!Number.isFinite(gap) || gap <= 0) return "0";
  return String(Math.round(gap * 10000) / 10000);
}
