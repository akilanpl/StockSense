import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { operationStatuses } from "@/lib/statuses";

export const metadata = { title: "Receipts" };

export default function ReceiptsPage() {
  return (
    <ListPage
      title="Receipts"
      description="Incoming operations that bring stock into a warehouse location."
      searchPlaceholder="Search by reference or partner"
      statuses={operationStatuses}
      actions={
        <CreateRecordButton
          label="Create Receipt"
          title="Create receipt"
          description="Receipts are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "Receipt reference" },
            { name: "partner", label: "Receive from", placeholder: "Vendor or source" },
            { name: "destination", label: "Destination", placeholder: "Warehouse location" },
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
          id: "warehouse",
          label: "Warehouse",
          options: [{ value: "all", label: "All warehouses" }],
        },
      ]}
      columns={columns("Reference", "Receive from", "Destination", "Scheduled", "Status")}
      emptyTitle="No receipts"
      emptyDescription="Incoming receipts will show their source, destination location, schedule, and status."
    />
  );
}
