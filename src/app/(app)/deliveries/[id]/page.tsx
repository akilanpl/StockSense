import { DeliveryDetailView } from "@/components/deliveries/DeliveryDetailView";

export const metadata = { title: "Delivery" };

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DeliveryDetailView deliveryId={id} />;
}
