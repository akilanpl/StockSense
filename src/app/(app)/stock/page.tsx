import { ListPage } from "@/components/modules/ListPage";
import { getStock } from "@/lib/api";
import { columns } from "@/lib/columns";
import { stockStatuses } from "@/lib/statuses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock" };

export default async function StockPage() {
  const stock = await getStock();

  return (
    <ListPage
      title="Stock"
      description="On-hand quantity for each product at each location."
      context="Reserved quantity is not tracked. Available quantity is not calculated separately from on-hand stock."
      searchPlaceholder="Search by product or location"
      statuses={stockStatuses}
      filters={[
        {
          id: "product",
          label: "Product",
          options: [{ value: "all", label: "All products" }],
        },
        {
          id: "location",
          label: "Location",
          options: [{ value: "all", label: "All locations" }],
        },
        {
          id: "availability",
          label: "Availability",
          options: [
            { value: "all", label: "All availability" },
            { value: "in", label: "In stock" },
            { value: "low", label: "Low stock" },
            { value: "out", label: "Out of stock" },
          ],
        },
      ]}
      columns={columns("Product", "Location", "On hand", "Reserved", "Available")}
      rows={stock.map((row) => ({
        id: row.id,
        cells: [`${row.sku} · ${row.productName}`, row.locationCode, row.quantity, "—", "—"],
      }))}
      emptyTitle="No stock rows"
      emptyDescription="Product and location quantities will be listed here when stock is recorded."
    />
  );
}
