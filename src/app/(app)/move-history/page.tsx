import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";

export const metadata = { title: "Move History" };

export default function MoveHistoryPage() {
  return (
    <ListPage
      title="Move History"
      description="Posted movements across receipts, deliveries, internal transfers, and adjustments."
      searchPlaceholder="Search by product or reference"
      filters={[
        {
          id: "type",
          label: "Movement type",
          options: [
            { value: "all", label: "All types" },
            { value: "receipt", label: "Receipt" },
            { value: "delivery", label: "Delivery" },
            { value: "transfer", label: "Internal transfer" },
            { value: "adjustment", label: "Adjustment" },
          ],
        },
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
      ]}
      columns={columns("When", "Type", "Product", "From", "To", "Quantity", "Reference")}
      emptyTitle="No movements posted"
      emptyDescription="Completed stock moves will appear here with their source, destination, and quantity."
    />
  );
}
