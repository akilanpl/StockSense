import { StockBoard } from "@/components/stock/StockBoard";
import { getCurrentUser } from "@/server/auth";
import { redirect } from "next/navigation";
import { listLocations as getLocations } from "@/server/catalog/locations";
import { listProducts as getProducts } from "@/server/catalog/products";
import { listStock as getStock } from "@/server/inventory/queries";
import { listWarehouses as getWarehouses } from "@/server/catalog/warehouses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock" };

export default async function StockPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [stock, products, locations, warehouses] = await Promise.all([
    getStock({}),
    getProducts({}),
    getLocations(),
    getWarehouses(),
  ]);

  return (
    <StockBoard
      initialStock={stock}
      products={products}
      locations={locations}
      warehouses={warehouses}
    />
  );
}
