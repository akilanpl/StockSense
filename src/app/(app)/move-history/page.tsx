import { ListPage } from "@/components/modules/ListPage";
import { getLocations, getMoves } from "@/lib/api";
import { columns } from "@/lib/columns";
import { formatLabel, formatTimestamp } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Move History" };

export default async function MoveHistoryPage() {
  const [moves, locations] = await Promise.all([getMoves(), getLocations()]);
  const locationCodes = new Map(locations.map((location) => [location.id, location.code]));

  return (
    <ListPage
      title="Move History"
      description="Posted movements across receipts, deliveries, internal transfers, and adjustments."
      searchPlaceholder="Search by product or reference"
      filters={[
        {
          id: "type",
          label: "Movement type",
          options: [
            { value: "all", label: "All types" },
            { value: "RECEIPT", label: "Receipt" },
            { value: "DELIVERY", label: "Delivery" },
            { value: "TRANSFER", label: "Internal transfer" },
            { value: "ADJUSTMENT", label: "Adjustment" },
          ],
        },
        {
          id: "product",
          label: "Product",
          options: [{ value: "all", label: "All products" }],
        },
        {
          id: "location",
          label: "Location",
          options: [{ value: "all", label: "All locations" }],
        },
      ]}
      columns={columns("When", "Type", "Product", "From", "To", "Quantity", "Reference")}
      rows={moves.map((move) => ({
        id: move.id,
        cells: [
          formatTimestamp(move.createdAt),
          formatLabel(move.movementType),
          move.sku ?? move.productId,
          locationCodes.get(move.sourceLocationId ?? "") ?? move.sourceLocationId ?? "—",
          locationCodes.get(move.destinationLocationId ?? "") ?? move.destinationLocationId ?? "—",
          move.quantity,
          move.operationReference ?? "—",
        ],
      }))}
      emptyTitle="No movements posted"
      emptyDescription="Completed stock moves will appear here with their source, destination, and quantity."
    />
  );
}
