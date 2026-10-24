import { AdjustmentDetailView } from "@/components/adjustments/AdjustmentDetailView";

export const metadata = { title: "Adjustment" };

export default async function AdjustmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
<<<<<<< HEAD

=======
>>>>>>> 270621e (feat: complete StockSense inventory management system)
  return <AdjustmentDetailView adjustmentId={id} />;
}
