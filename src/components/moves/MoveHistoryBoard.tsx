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
import { getMoves } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { columns } from "@/lib/columns";
import { formatLabel, formatTimestamp } from "@/lib/format";
import type { Location, MovementType, Product, StockMove } from "@/types/api";

export function MoveHistoryBoard({
  initialMoves,
  products,
  locations,
}: {
  initialMoves: StockMove[];
  products: Product[];
  locations: Location[];
}) {
  const [movementType, setMovementType] = useState("");
  const [productId, setProductId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [operationDraft, setOperationDraft] = useState("");
  const [operationId, setOperationId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [moves, setMoves] = useState(initialMoves);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getMoves({
      movementType: (movementType || undefined) as MovementType | undefined,
      productId: productId || undefined,
      sourceLocationId: sourceLocationId || undefined,
      destinationLocationId: destinationLocationId || undefined,
      operationId: operationId.trim() || undefined,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    })
      .then((rows) => {
        if (!active) return;
        setMoves(rows);
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
  }, [movementType, productId, sourceLocationId, destinationLocationId, operationId, from, to, reloadKey]);

  const names = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);
  const codes = useMemo(() => new Map(locations.map((location) => [location.id, location.code])), [locations]);
  const q = search.trim().toLowerCase();
  const visibleMoves = moves.filter((move) => {
    if (!q) return true;
    const source = move.sourceLocationId ? codes.get(move.sourceLocationId) : "";
    const destination = move.destinationLocationId ? codes.get(move.destinationLocationId) : "";
    return [names.get(move.productId), move.sku, source, destination, move.operationReference, move.movementType]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  function locationLabel(id: string | null) {
    if (!id) return "—";
    return codes.get(id) ?? id;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Move History"
        description="Posted ledger of receipts, deliveries, transfers, and adjustments."
      />
      <Card>
        <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Search" placeholder="Product, SKU, location, or reference" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            label="Movement type"
            value={movementType}
            onChange={(event) => {
              setLoading(true);
              setMovementType(event.target.value);
            }}
            options={[
              { value: "", label: "All types" },
              { value: "RECEIPT", label: "Receipt" },
              { value: "DELIVERY", label: "Delivery" },
              { value: "TRANSFER", label: "Internal transfer" },
              { value: "ADJUSTMENT", label: "Adjustment" },
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
            label="Source"
            value={sourceLocationId}
            onChange={(event) => {
              setLoading(true);
              setSourceLocationId(event.target.value);
            }}
            options={[{ value: "", label: "Any source" }, ...locations.map((location) => ({ value: location.id, label: location.code }))]}
          />
          <Select
            label="Destination"
            value={destinationLocationId}
            onChange={(event) => {
              setLoading(true);
              setDestinationLocationId(event.target.value);
            }}
            options={[{ value: "", label: "Any destination" }, ...locations.map((location) => ({ value: location.id, label: location.code }))]}
          />
          <Input label="From" type="date" value={from} onChange={(event) => { setLoading(true); setFrom(event.target.value); }} />
          <Input label="To" type="date" value={to} onChange={(event) => { setLoading(true); setTo(event.target.value); }} />
          <Input
            label="Operation id"
            value={operationDraft}
            onChange={(event) => setOperationDraft(event.target.value)}
            onBlur={() => {
              setLoading(true);
              setOperationId(operationDraft.trim());
            }}
          />
        </div>
        {loading ? <LoadingState label="Loading movements" /> : null}
        {error ? <ErrorState description={error} onRetry={() => { setLoading(true); setReloadKey((value) => value + 1); }} /> : null}
        {!loading && !error && visibleMoves.length === 0 ? (
          <EmptyState title="No movements posted" description="Validated operations add rows to this ledger." />
        ) : null}
        {!loading && !error && visibleMoves.length > 0 ? (
          <DataTable
            columns={columns("When", "Type", "Product", "SKU", "Source", "Destination", "Quantity", "Reference")}
            rows={visibleMoves.map((move) => ({
              id: move.id,
              cells: [
                formatTimestamp(move.createdAt),
                formatLabel(move.movementType),
                names.get(move.productId) ?? move.sku ?? move.productId,
                move.sku ?? "—",
                locationLabel(move.sourceLocationId),
                locationLabel(move.destinationLocationId),
                move.quantity,
                move.operationReference ?? "—",
              ],
            }))}
            emptyTitle="No movements"
            emptyDescription="No ledger rows match these filters."
          />
        ) : null}
      </Card>
    </div>
  );
}
