import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { operationStatuses } from "@/lib/statuses";

export const metadata = { title: "Adjustments" };

export default function AdjustmentsPage() {
  return (
    <ListPage
      title="Adjustments"
      description="Counted corrections that raise or lower on-hand quantity for a product at a location."
      context="Each adjustment is tied to one product and one location."
      searchPlaceholder="Search by reference or product"
      statuses={operationStatuses}
      actions={
        <CreateRecordButton
          label="Create Adjustment"
          title="Create adjustment"
          description="Adjustments are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "Adjustment reference" },
            { name: "product", label: "Product", placeholder: "Product" },
            { name: "location", label: "Location", placeholder: "Location" },
          ]}
        />
      }
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
      ]}
      columns={columns("Reference", "Product", "Location", "Counted", "Difference", "Status")}
      emptyTitle="No adjustments"
      emptyDescription="Inventory counts will list the product, location, counted quantity, and difference."
    />
  );
}
