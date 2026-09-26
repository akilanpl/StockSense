import { TransferDetailView } from "@/components/transfers/TransferDetailView";

export const metadata = { title: "Transfer" };

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TransferDetailView transferId={id} />;
}
