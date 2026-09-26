import { ReceiptDetailView } from "@/components/receipts/ReceiptDetailView";

export const metadata = { title: "Receipt" };

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReceiptDetailView receiptId={id} />;
}
