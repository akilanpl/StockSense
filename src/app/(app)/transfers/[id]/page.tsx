import { DetailPage } from "@/components/modules/DetailPage";
import { TransferDetailActions } from "@/app/(app)/transfers/components/TransferDetailActions";

export const metadata = { title: "Transfer" };

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <DetailPage
        backHref="/transfers"
        backLabel="Internal Transfers"
        title={`Transfer ${id}`}
        description="Internal stock movement — stock leaves one location and arrives at another within the same warehouse network."
        sections={[
          {
            title: "Route",
            fields: [
              { label: "Reference", hint: "Transfer document number" },
              { label: "Source", hint: "Location stock leaves from" },
              { label: "Destination", hint: "Location stock arrives at" },
              { label: "Status", hint: "Draft · Waiting · Ready · Done · Cancelled" },
            ],
          },
          {
            title: "Schedule & Warehouse",
            fields: [
              { label: "Scheduled", hint: "Planned move date" },
              { label: "Warehouse", hint: "Warehouse that owns this move" },
            ],
          },
        ]}
      />
      <TransferDetailActions />
    </div>
  );
}
