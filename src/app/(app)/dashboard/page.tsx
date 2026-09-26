import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { columns } from "@/lib/columns";

const kpis = [
  {
    label: "Total Products in Stock",
    hint: "Products with quantity on hand, once stock levels are connected.",
  },
  {
    label: "Low Stock",
    hint: "Products at or below their reorder point.",
  },
  {
    label: "Out of Stock",
    hint: "Products with no available quantity.",
  },
  {
    label: "Pending Receipts",
    hint: "Incoming receipts that are not done.",
  },
  {
    label: "Pending Deliveries",
    hint: "Outgoing deliveries that are not done.",
  },
  {
    label: "Internal Transfers Scheduled",
    hint: "Transfers waiting to move stock between locations.",
  },
];

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Operational snapshot for stock, receipts, deliveries, and internal transfers. Figures stay blank until inventory data is connected."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} hint={kpi.hint} />
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
            columns={columns("When", "Product", "From", "To", "Quantity", "Reference")}
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
            columns={columns("Product", "Location", "On hand")}
            emptyTitle="No low-stock items"
            emptyDescription="Items below their reorder point will appear here."
          />
        </Card>
      </div>
      <Card>
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-sm font-semibold">Pending Operations</h2>
          <p className="mt-1 text-xs text-muted">
            Receipts, deliveries, and transfers that still need action.
          </p>
        </div>
        <DataTable
          columns={columns("Type", "Reference", "Warehouse", "Scheduled", "Status")}
          emptyTitle="No pending operations"
          emptyDescription="Open receipts, deliveries, and transfers will be listed here."
        />
      </Card>
    </div>
  );
}
