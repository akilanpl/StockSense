import { InventoryHealth } from "@/components/dashboard/InventoryHealth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDashboard, getLocations, getMoves, getOperations, getStock, getWarehouses } from "@/lib/api";
import { columns } from "@/lib/columns";
import { formatLabel, formatTimestamp } from "@/lib/format";
import type { StatusTone } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const openStatuses = new Set(["DRAFT", "WAITING", "READY"]);

const statusTones: Record<string, StatusTone> = {
  DRAFT: "neutral",
  WAITING: "warning",
  READY: "info",
  DONE: "success",
  CANCELED: "danger",
};

export default async function DashboardPage() {
  const [dashboard, moves, operations, locations, warehouses, stock] = await Promise.all([
    getDashboard(),
    getMoves(),
    getOperations(),
    getLocations(),
    getWarehouses(),
    getStock(),
  ]);
  const locationCodes = new Map(locations.map((location) => [location.id, location.code]));
  const locationWarehouses = new Map(
    locations.map((location) => [location.id, location.warehouseId]),
  );
  const warehouseNames = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]));

  const kpis = [
    {
      label: "Total Products in Stock",
      value: dashboard.totalProductsInStock,
      hint: "Distinct products with quantity on hand.",
    },
    {
      label: "Low Stock",
      value: dashboard.lowStockCount,
      hint: "Quantities above zero and at or below an active reorder rule.",
    },
    {
      label: "Out of Stock",
      value: dashboard.outOfStockCount,
      hint: "Stock rows whose quantity is zero.",
    },
    {
      label: "Pending Receipts",
      value: dashboard.pendingReceipts,
      hint: "Receipts that are draft, waiting, or ready.",
    },
    {
      label: "Pending Deliveries",
      value: dashboard.pendingDeliveries,
      hint: "Deliveries that are draft, waiting, or ready.",
    },
    {
      label: "Internal Transfers Scheduled",
      value: dashboard.scheduledInternalTransfers,
      hint: "Transfers that are waiting or ready.",
    },
  ];

  const pending = operations.filter((operation) => openStatuses.has(operation.status));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Operational snapshot for stock, receipts, deliveries, and internal transfers."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} hint={kpi.hint} value={kpi.value} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <div className="border-b border-border px-3 py-3">
            <h2 className="text-sm font-semibold">Recent Stock Movements</h2>
            <p className="mt-1 text-xs text-muted">
              Receipts, deliveries, transfers, and adjustments in the order they post.
            </p>
          </div>
          <DataTable
            columns={columns("When", "Type", "Product", "From", "To", "Quantity", "Reference")}
            rows={moves.slice(0, 8).map((move) => ({
              id: move.id,
              cells: [
                formatTimestamp(move.createdAt),
                formatLabel(move.movementType),
                move.sku ?? move.productId,
                locationLabel(locationCodes, move.sourceLocationId),
                locationLabel(locationCodes, move.destinationLocationId),
                move.quantity,
                move.operationReference ?? "—",
              ],
            }))}
            emptyTitle="No movements yet"
            emptyDescription="Posted stock movements will be listed here."
          />
        </Card>
        <Card>
          <div className="border-b border-border px-3 py-3">
            <h2 className="text-sm font-semibold">Low Stock Items</h2>
            <p className="mt-1 text-xs text-muted">
              Products that need replenishment at a location.
            </p>
          </div>
          <DataTable
            columns={columns("Product", "SKU", "Location", "On hand", "Minimum")}
            rows={dashboard.lowStockItems.map((item) => ({
              id: `${item.productId}-${item.locationId}`,
              cells: [item.productName, item.sku, item.locationCode, item.quantity, item.minimumQuantity],
            }))}
            emptyTitle="No low-stock items"
            emptyDescription="Items below an active reorder rule will appear here."
          />
        </Card>
      </div>
      <Card>
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-sm font-semibold">Pending Operations</h2>
          <p className="mt-1 text-xs text-muted">
            Receipts, deliveries, transfers, and adjustments that still need action.
          </p>
        </div>
        <DataTable
          columns={columns("Type", "Reference", "Warehouse", "Scheduled", "Status")}
          rows={pending.map((operation) => ({
            id: operation.id,
            cells: [
              formatLabel(operation.type),
              operation.reference,
              warehouseLabel(operation, locationWarehouses, warehouseNames),
              "—",
              <StatusBadge
                key={operation.id}
                label={formatLabel(operation.status)}
                tone={statusTones[operation.status] ?? "neutral"}
              />,
            ],
          }))}
          emptyTitle="No pending operations"
          emptyDescription="Open receipts, deliveries, transfers, and adjustments will be listed here."
        />
      </Card>
      <InventoryHealth lowStockItems={dashboard.lowStockItems} stock={stock} />
    </div>
  );
}

function locationLabel(codes: Map<string, string>, id: string | null) {
  if (!id) {
    return "—";
  }

  return codes.get(id) ?? id;
}

function warehouseLabel(
  operation: { sourceLocationId: string | null; destinationLocationId: string | null },
  locationWarehouses: Map<string, string>,
  warehouseNames: Map<string, string>,
) {
  const locationId = operation.sourceLocationId ?? operation.destinationLocationId;

  if (!locationId) {
    return "—";
  }

  const warehouseId = locationWarehouses.get(locationId);
  return warehouseId ? (warehouseNames.get(warehouseId) ?? "—") : "—";
}
