import { CreateRecordButton } from "@/components/modules/CreateRecordButton";
import { ListPage } from "@/components/modules/ListPage";
import { columns } from "@/lib/columns";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <ListPage
      title="Products"
      description="Catalog of stockable items, units of measure, and tracking used by receipts, deliveries, and adjustments."
      searchPlaceholder="Search by name or SKU"
      actions={
        <CreateRecordButton
          label="Add Product"
          title="Add product"
          description="Product records are not saved in this phase."
          fields={[
            { name: "name", label: "Product name", placeholder: "Product name" },
            { name: "sku", label: "SKU", placeholder: "Internal reference" },
            { name: "uom", label: "Unit of measure", placeholder: "Unit" },
          ]}
        />
      }
      filters={[
        {
          id: "category",
          label: "Category",
          options: [{ value: "all", label: "All categories" }],
        },
        {
          id: "tracking",
          label: "Tracking",
          options: [
            { value: "all", label: "All tracking" },
            { value: "none", label: "No tracking" },
            { value: "lot", label: "By lot" },
            { value: "serial", label: "By serial" },
          ],
        },
      ]}
      columns={columns("SKU", "Product", "Category", "Unit", "Tracking", "Status")}
      emptyTitle="No products in the catalog"
      emptyDescription="Products you add will be listed here with their SKU, unit, and tracking method."
    />
  );
}
