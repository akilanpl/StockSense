import { DetailPage } from "@/components/modules/DetailPage";

export const metadata = { title: "Transfer" };

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DetailPage
      backHref="/transfers"
      backLabel="Transfers"
      title={`Transfer ${id}`}
      description="Internal move between two locations, with the products and quantities on each line."
      sections={[
        {
          title: "Route",
          fields: [
            { label: "Reference", hint: "Transfer document number" },
            { label: "Source", hint: "Location stock leaves" },
            { label: "Destination", hint: "Location stock arrives" },
            { label: "Status", hint: "Draft, waiting, ready, done, or cancelled" },
          ],
        },
        {
          title: "Schedule",
          fields: [
            { label: "Scheduled", hint: "Planned move date" },
            { label: "Warehouse", hint: "Warehouse that owns the move" },
          ],
        },
      ]}
    />
  );
}
