import { DetailPage } from "@/components/modules/DetailPage";

export const metadata = { title: "Delivery" };

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DetailPage
      backHref="/deliveries"
      backLabel="Deliveries"
      title={`Delivery ${id}`}
      description="Outgoing operation with customer, source location, and product lines."
      sections={[
        {
          title: "Operation",
          fields: [
            { label: "Reference", hint: "Delivery document number" },
            { label: "Deliver to", hint: "Customer or destination partner" },
            { label: "Scheduled", hint: "Expected ship date" },
            { label: "Status", hint: "Draft, waiting, ready, done, or cancelled" },
          ],
        },
        {
          title: "Source",
          fields: [
            { label: "Warehouse", hint: "Shipping warehouse" },
            { label: "Location", hint: "Location stock is taken from" },
          ],
        },
      ]}
    />
  );
}
