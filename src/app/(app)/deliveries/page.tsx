import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { operationStatuses } from "@/lib/statuses";

export const metadata = { title: "Deliveries" };

export default function DeliveriesPage() {
  return (
    <ListPage
      title="Deliveries"
      description="Outgoing operations that move stock from a warehouse location to a customer or destination."
      searchPlaceholder="Search by reference or customer"
      statuses={operationStatuses}
      actions={
        <CreateRecordButton
          label="Create Delivery"
          title="Create delivery"
          description="Deliveries are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "Delivery reference" },
            { name: "customer", label: "Deliver to", placeholder: "Customer" },
            { name: "source", label: "Source location", placeholder: "Warehouse location" },
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
      ]}
      columns={columns("Reference", "Deliver to", "Source", "Scheduled", "Status")}
      emptyTitle="No deliveries"
      emptyDescription="Outgoing deliveries will show the customer, source location, schedule, and status."
    />
  );
}
