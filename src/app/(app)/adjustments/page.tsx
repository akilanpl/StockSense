import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { operationStatuses } from "@/lib/statuses";

export const metadata = { title: "Adjustments" };

export default function AdjustmentsPage() {
  return (
    <ListPage
      title="Inventory Adjustments"
      description="Counted corrections that raise or lower the on-hand quantity for a product at a specific location. Each adjustment compares the physical count against the system quantity."
      searchPlaceholder="Search by reference or product"
      statuses={operationStatuses}
      actions={
        <CreateRecordButton
          label="Create Adjustment"
          title="Create inventory adjustment"
          description="Record a physical count to correct the system quantity for a product at a location. Adjustments are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "e.g. INV/ADJ/2024/00001" },
            { name: "product", label: "Product", placeholder: "Product name or SKU" },
            { name: "location", label: "Location", placeholder: "e.g. WH/Stock" },
            { name: "counted", label: "Physical count (counted qty)", placeholder: "0", type: "text" },
          ]}
        />
      }
      filters={[
        {
          id: "status",
          label: "Status",
          options: [
            { value: "all", label: "All statuses" },
            ...operationStatuses.map((status) => ({
              value: status.label.toLowerCase(),
              label: status.label,
            })),
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
      columns={columns("Reference", "Product", "Location", "Counted qty", "Difference", "Status")}
      emptyTitle="No adjustments found"
      emptyDescription="Inventory count adjustments will appear here showing the product, location, physical count, system quantity difference, and status. Use 'Create Adjustment' to begin a new count correction."
    />
  );
}
