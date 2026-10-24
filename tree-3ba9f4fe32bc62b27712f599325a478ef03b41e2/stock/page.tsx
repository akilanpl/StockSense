import { StockBoard } from "@/components/stock/StockBoard";
import { getLocations, getProducts, getStock, getWarehouses } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock" };

export default async function StockPage() {
  const [stock, products, locations, warehouses] = await Promise.all([
    getStock(),
    getProducts(),
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
