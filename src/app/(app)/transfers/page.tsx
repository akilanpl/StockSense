import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { operationStatuses } from "@/lib/statuses";

export const metadata = { title: "Transfers" };

export default function TransfersPage() {
  return (
    <ListPage
      title="Internal Transfers"
      description="Internal movements of stock between two locations within your warehouse network. No goods leave or arrive from outside."
      searchPlaceholder="Search by reference"
      statuses={operationStatuses}
      actions={
        <CreateRecordButton
          label="Create Transfer"
          title="Create internal transfer"
          description="Move stock between locations within your warehouse. Transfers are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "e.g. INT/2024/00042" },
            { name: "warehouse", label: "Warehouse", placeholder: "Warehouse that owns this move" },
            { name: "source", label: "Source location", placeholder: "From location (e.g. WH/Stock)" },
            { name: "destination", label: "Destination location", placeholder: "To location (e.g. WH/Output)" },
            { name: "product", label: "Product", placeholder: "Product name or SKU" },
            { name: "quantity", label: "Quantity", placeholder: "0", type: "text" },
            { name: "scheduled", label: "Scheduled date", placeholder: "YYYY-MM-DD", type: "text" },
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
          id: "source",
          label: "Source",
          options: [{ value: "all", label: "All source locations" }],
        },
        {
          id: "destination",
          label: "Destination",
          options: [{ value: "all", label: "All destination locations" }],
        },
      ]}
      columns={columns("Reference", "Source", "Destination", "Scheduled", "Status")}
      emptyTitle="No transfers found"
      emptyDescription="Internal stock moves will appear here showing source, destination, schedule, and status. Use 'Create Transfer' to record a new internal movement."
    />
  );
}
