import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { stockStatuses } from "@/lib/statuses";

export const metadata = { title: "Stock" };

export default function StockPage() {
  return (
    <ListPage
      title="Stock"
      description="On-hand, reserved, and available quantity for each product at each location."
      context="Quantities stay blank until stock levels are connected."
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
      emptyTitle="No stock rows"
      emptyDescription="Product and location quantities will be listed here when stock is connected."
    />
  );
}
