import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";

export const metadata = { title: "Locations" };

export default function LocationsPage() {
  return (
    <ListPage
      title="Locations"
      description="Stock locations inside warehouses, including internal, view, and inventory-loss locations."
      searchPlaceholder="Search by location name"
      actions={
        <CreateRecordButton
          label="Add Location"
          title="Add location"
          description="Locations are not saved in this phase."
          fields={[
            { name: "name", label: "Location name", placeholder: "Location name" },
            { name: "warehouse", label: "Warehouse", placeholder: "Parent warehouse" },
            { name: "type", label: "Location type", placeholder: "Internal, view, or inventory loss" },
          ]}
        />
      }
      filters={[
        {
          id: "warehouse",
          label: "Warehouse",
          options: [{ value: "all", label: "All warehouses" }],
        },
        {
          id: "type",
          label: "Type",
          options: [
            { value: "all", label: "All types" },
            { value: "internal", label: "Internal" },
            { value: "view", label: "View" },
            { value: "inventory", label: "Inventory loss" },
          ],
        },
      ]}
      columns={columns("Name", "Warehouse", "Type", "Parent", "Status")}
      emptyTitle="No locations"
      emptyDescription="Locations will be listed with their warehouse, type, and parent location."
    />
  );
}
