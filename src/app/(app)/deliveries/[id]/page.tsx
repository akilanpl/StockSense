import { DetailPage } from "@/components/modules/DetailPage";
import { DeliveryDetailActions } from "@/app/(app)/deliveries/components/DeliveryDetailActions";

export const metadata = { title: "Delivery" };

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <DetailPage
        backHref="/deliveries"
        backLabel="Deliveries"
        title={`Delivery ${id}`}
        description="Outgoing operation — moves stock from a warehouse location to a customer or destination."
        sections={[
          {
            title: "Operation",
            fields: [
              { label: "Reference", hint: "Delivery document number" },
              { label: "Deliver to", hint: "Customer or destination partner" },
              { label: "Scheduled", hint: "Expected ship date" },
              { label: "Status", hint: "Draft · Waiting · Ready · Done · Cancelled" },
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
      <DeliveryDetailActions />
    </div>
  );
}
