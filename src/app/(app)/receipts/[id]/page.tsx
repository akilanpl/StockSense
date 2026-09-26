import { DetailPage } from "@/components/modules/DetailPage";

export const metadata = { title: "Receipt" };

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DetailPage
      backHref="/receipts"
      backLabel="Receipts"
      title={`Receipt ${id}`}
      description="Incoming operation with source, destination location, and product lines."
      sections={[
        {
          title: "Operation",
          fields: [
            { label: "Reference", hint: "Receipt document number" },
            { label: "Receive from", hint: "Vendor or source partner" },
            { label: "Scheduled", hint: "Expected arrival" },
            { label: "Status", hint: "Draft, waiting, ready, done, or cancelled" },
          ],
        },
        {
          title: "Destination",
          fields: [
            { label: "Warehouse", hint: "Receiving warehouse" },
            { label: "Location", hint: "Stock location that will hold the goods" },
          ],
        },
      ]}
    />
  );
}
