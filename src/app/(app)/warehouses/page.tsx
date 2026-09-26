import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";

export const metadata = { title: "Warehouses" };

export default function WarehousesPage() {
  return (
    <ListPage
      title="Warehouses"
      description="Physical sites that own stock locations and warehouse operations."
      searchPlaceholder="Search by name or code"
      actions={
        <CreateRecordButton
          label="Add Warehouse"
          title="Add warehouse"
          description="Warehouses are not saved in this phase."
          fields={[
            { name: "name", label: "Warehouse name", placeholder: "Warehouse name" },
            { name: "code", label: "Short code", placeholder: "Code" },
            { name: "address", label: "Address", placeholder: "Address" },
          ]}
        />
      }
      columns={columns("Name", "Code", "Address", "Status")}
      emptyTitle="No warehouses"
      emptyDescription="Warehouses you add will be listed with their code and address."
    />
  );
}
