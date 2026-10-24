import { MoveHistoryBoard } from "@/components/moves/MoveHistoryBoard";
import { getLocations, getMoves, getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Move History" };

export default async function MoveHistoryPage() {
  const [moves, products, locations] = await Promise.all([getMoves(), getProducts(), getLocations()]);
  return <MoveHistoryBoard initialMoves={moves} products={products} locations={locations} />;
}
