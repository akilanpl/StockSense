import { MoveHistoryBoard } from "@/components/moves/MoveHistoryBoard";
import { getCurrentUser } from "@/server/auth";
import { redirect } from "next/navigation";
import { listLocations as getLocations } from "@/server/catalog/locations";
import { listMoves as getMoves } from "@/server/inventory/queries";
import { listProducts as getProducts } from "@/server/catalog/products";

export const dynamic = "force-dynamic";
export const metadata = { title: "Move History" };

export default async function MoveHistoryPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [moves, products, locations] = await Promise.all([getMoves({}), getProducts({}), getLocations()]);
  return <MoveHistoryBoard initialMoves={moves} products={products} locations={locations} />;
}
