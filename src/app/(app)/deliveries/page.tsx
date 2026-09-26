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
          description="Fill in the details below. Deliveries are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "e.g. OUT/2024/00123" },
            { name: "customer", label: "Deliver to", placeholder: "Customer or destination" },
            { name: "warehouse", label: "Source warehouse", placeholder: "Warehouse" },
            { name: "source", label: "Source location", placeholder: "e.g. WH/Stock" },
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
          id: "warehouse",
          label: "Warehouse",
          options: [{ value: "all", label: "All warehouses" }],
        },
      ]}
      columns={columns("Reference", "Deliver to", "Source", "Scheduled", "Status")}
      emptyTitle="No deliveries found"
      emptyDescription="Outgoing deliveries will appear here showing the customer, source location, schedule, and status. Use 'Create Delivery' to add a new outgoing operation."
    />
  );
}
