import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";
import { operationStatuses } from "@/lib/statuses";

export const metadata = { title: "Transfers" };

export default function TransfersPage() {
  return (
    <ListPage
      title="Transfers"
      description="Internal moves of stock from a source location to a destination location."
      context="Source and destination stay blank until warehouses and locations are connected."
      searchPlaceholder="Search by reference"
      statuses={operationStatuses}
      actions={
        <CreateRecordButton
          label="Create Transfer"
          title="Create transfer"
          description="Transfers are not saved in this phase."
          fields={[
            { name: "reference", label: "Reference", placeholder: "Transfer reference" },
            { name: "source", label: "Source location", placeholder: "From location" },
            { name: "destination", label: "Destination location", placeholder: "To location" },
          ]}
        />
      }
      filters={[
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
      emptyTitle="No transfers"
      emptyDescription="Internal transfers will show where stock leaves and where it arrives."
    />
  );
}
