"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { getDashboard, getStock } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { columns } from "@/lib/columns";
import { formatTimestamp } from "@/lib/format";
import type { Location, Product, StockQuant, Warehouse } from "@/types/api";

export function StockBoard({
  initialStock,
  products,
  locations,
  warehouses,
}: {
  initialStock: StockQuant[];
  products: Product[];
  locations: Location[];
  warehouses: Warehouse[];
}) {
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [lowKeys, setLowKeys] = useState<Set<string>>(new Set());
  const [stock, setStock] = useState(initialStock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      getStock({
        productId: productId || undefined,
        locationId: locationId || undefined,
        warehouseId: warehouseId || undefined,
      }),
      getDashboard(),
    ])
      .then(([rows, dashboard]) => {
        if (!active) return;
        setStock(rows);
        setLowKeys(new Set(dashboard.lowStockItems.map((item) => `${item.productId}:${item.locationId}`)));
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(userFacingMessage(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId, locationId, warehouseId, reloadKey]);

  const warehouseNames = useMemo(
    () => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses],
  );
  const visibleLocations = locations.filter((location) => !warehouseId || location.warehouseId === warehouseId);
  const q = search.trim().toLowerCase();
  const rows = stock.filter((row) => {
    const quantity = Number(row.quantity);
    if (availability === "in" && !(quantity > 0)) return false;
    if (availability === "out" && quantity !== 0) return false;
    if (availability === "low" && !lowKeys.has(`${row.productId}:${row.locationId}`)) return false;
    if (!q) return true;
    return [row.productName, row.sku, row.locationCode, warehouseNames.get(row.warehouseId)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock"
        description="On-hand quantity for each product at each location."
      />
      <p className="text-sm text-muted">On-hand quantity is the recorded stock. Reserved and available quantities are not tracked.</p>
      <Card>
        <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-2 xl:grid-cols-5">
          <Input label="Search" placeholder="Product, SKU, or location" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            label="Availability"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            options={[
              { value: "", label: "All quantities" },
              { value: "in", label: "On hand" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ]}
          />
          <Select
            label="Product"
            value={productId}
            onChange={(event) => {
              setLoading(true);
              setProductId(event.target.value);
            }}
            options={[{ value: "", label: "All products" }, ...products.map((product) => ({ value: product.id, label: `${product.sku} · ${product.name}` }))]}
          />
          <Select
            label="Warehouse"
            value={warehouseId}
            onChange={(event) => {
              setLoading(true);
              setWarehouseId(event.target.value);
              setLocationId("");
            }}
            options={[{ value: "", label: "All warehouses" }, ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))]}
          />
          <Select
            label="Location"
            value={locationId}
            onChange={(event) => {
              setLoading(true);
              setLocationId(event.target.value);
            }}
            options={[{ value: "", label: "All locations" }, ...visibleLocations.map((location) => ({ value: location.id, label: `${location.code} · ${location.name}` }))]}
          />
        </div>
        {loading ? <LoadingState label="Loading stock" /> : null}
        {error ? (
          <ErrorState
            description={error}
            onRetry={() => {
              setLoading(true);
              setReloadKey((value) => value + 1);
            }}
          />
        ) : null}
        {!loading && !error && rows.length === 0 ? (
          <EmptyState title="No stock rows" description="Quantities appear here after a receipt, transfer, or adjustment is validated." />
        ) : null}
        {!loading && !error && rows.length > 0 ? (
          <DataTable
            columns={columns("Product", "SKU", "Location", "Warehouse", "On hand", "Updated")}
            rows={rows.map((row) => ({
              id: row.id,
              cells: [
                row.productName,
                row.sku,
                row.locationCode,
                warehouseNames.get(row.warehouseId) ?? "—",
                row.quantity,
                formatTimestamp(row.updatedAt),
              ],
            }))}
            emptyTitle="No stock rows"
            emptyDescription="No quantities match these filters."
          />
        ) : null}
      </Card>
    </div>
  );
}
