import { DetailPage } from "@/components/modules/DetailPage";

export const metadata = { title: "Product" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DetailPage
      backHref="/products"
      backLabel="Products"
      title={`Product ${id}`}
      description="Identity, unit of measure, and tracking for this catalog item."
      sections={[
        {
          title: "Identity",
          fields: [
            { label: "Name", hint: "Display name from the catalog" },
            { label: "SKU", hint: "Internal reference" },
            { label: "Category", hint: "Catalog grouping" },
            { label: "Unit of measure", hint: "Base unit for stock" },
          ],
        },
        {
          title: "Tracking",
          fields: [
            { label: "Tracking", hint: "None, lot, or serial" },
            { label: "Status", hint: "Active or archived" },
          ],
        },
      ]}
    />
  );
}
