"use client";

<<<<<<< HEAD
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusLegend } from "@/components/modules/StatusLegend";
import { getLocations, getOperations, getProducts, getStock, userFacingMessage } from "@/lib/api";
import { useApiQuery } from "@/lib/api/use-api-query";
import { operationStatuses } from "@/lib/statuses";
import { CreateAdjustmentModal } from "./CreateAdjustmentModal";
import {
  adjustmentLocationCode,
  adjustmentLocationId,
  formatDifference,
  getStatusBadgeProps,
  stockKey,
} from "./types";

export function AdjustmentsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadPage = useCallback(async () => {
    const [opsData, locsData, prodsData, stockData] = await Promise.all([
      getOperations({ type: "ADJUSTMENT" }),
      getLocations(),
      getProducts(),
      getStock(),
    ]);

    const nextStock: Record<string, string> = {};
    for (const row of stockData) {
      nextStock[stockKey(row.productId, row.locationId)] = row.quantity;
    }

    return {
      adjustments: opsData,
      locations: locsData,
      products: prodsData,
      stockByKey: nextStock,
    };
  }, []);

  const query = useApiQuery(loadPage, "adjustments");
  const loading = query.status === "loading";
  const error = query.status === "error" ? userFacingMessage(query.error) : null;
  const adjustments = useMemo(() => query.data?.adjustments ?? [], [query.data]);
  const locations = query.data?.locations ?? [];
  const products = query.data?.products ?? [];
  const stockByKey = query.data?.stockByKey ?? {};

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((item) => {
      if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      const locationId = adjustmentLocationId(item);
      if (locationFilter !== "all" && locationId !== locationFilter) {
        return false;
      }

      if (productFilter !== "all" && !item.items.some((line) => line.productId === productFilter)) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = item.reference?.toLowerCase().includes(query);
        const matchesLocation = adjustmentLocationCode(item).toLowerCase().includes(query);
        const matchesItems = item.items?.some(
          (line) =>
            line.productName?.toLowerCase().includes(query) || line.sku?.toLowerCase().includes(query),
        );

        if (!matchesRef && !matchesLocation && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [adjustments, statusFilter, productFilter, locationFilter, searchQuery]);

  function handleAdjustmentCreated() {
    setIsCreateOpen(false);
    query.reload();
  }

  const filtersActive =
    searchQuery || statusFilter !== "all" || productFilter !== "all" || locationFilter !== "all";
=======
import { useCallback, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { QueryState } from "@/components/ui/QueryState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getLocations, getOperations, getProducts } from "@/lib/api";
import { useApiQuery } from "@/lib/api/use-api-query";
import { formatLabel, formatTimestamp } from "@/lib/format";
import { CreateAdjustmentModal } from "./CreateAdjustmentModal";
import type { AdjustmentOperation } from "./types";

const tones = {
  DRAFT: "neutral",
  WAITING: "warning",
  READY: "info",
  DONE: "success",
  CANCELED: "danger",
} as const;

export function AdjustmentsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [open, setOpen] = useState(false);
  const load = useCallback(
    () =>
      Promise.all([
        getOperations({
          type: "ADJUSTMENT",
          status: status ? (status as AdjustmentOperation["status"]) : undefined,
        }),
        getLocations(),
        getProducts(),
      ]),
    [status],
  );
  const query = useApiQuery(load, status);
>>>>>>> 270621e (feat: complete StockSense inventory management system)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Adjustments"
<<<<<<< HEAD
        description="Counted corrections that raise or lower on-hand quantity for a product at a location."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
=======
        description="Counted corrections that raise or lower on-hand quantity at one location."
        actions={
          <Button onClick={() => setOpen(true)}>
>>>>>>> 270621e (feat: complete StockSense inventory management system)
            <Icon name="plus" className="h-4 w-4" />
            Create Adjustment
          </Button>
        }
      />
<<<<<<< HEAD

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search by reference, product, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Cancelled</option>
            </select>

            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              aria-label="Filter by product"
              className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              aria-label="Filter by location"
              className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <StatusLegend items={operationStatuses} />

        {loading ? (
          <div className="py-12">
            <LoadingState label="Loading adjustments..." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState title="Error loading adjustments" description={error} onRetry={query.reload} />
          </div>
        ) : filteredAdjustments.length === 0 ? (
          <EmptyState
            title="No adjustments found"
            description={
              filtersActive
                ? "No inventory counts match your active filters."
                : "Inventory counts will list the product, location, counted quantity, and difference."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60">
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Reference
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted">
                    Counted
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted">
                    Difference
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAdjustments.map((op) => {
                  const badgeProps = getStatusBadgeProps(op.status);
                  const firstItem = op.items[0];
                  const locationId = adjustmentLocationId(op);
                  const systemQty =
                    firstItem && locationId
                      ? (stockByKey[stockKey(firstItem.productId, locationId)] ?? "0")
                      : "0";
                  const productLabel = firstItem
                    ? op.items.length > 1
                      ? `${firstItem.productName} +${op.items.length - 1}`
                      : firstItem.productName
                    : "—";

                  return (
                    <tr key={op.id} className="transition-colors hover:bg-background/40">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/adjustments/${op.id}`}
                          className="font-semibold text-accent hover:underline"
                        >
                          {op.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground">{productLabel}</td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {adjustmentLocationCode(op)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {firstItem?.requestedQuantity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {firstItem
                          ? op.status === "DONE"
                            ? firstItem.processedQuantity
                            : formatDifference(firstItem.requestedQuantity, systemQty)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={badgeProps.label} tone={badgeProps.tone} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/adjustments/${op.id}`}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateAdjustmentModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleAdjustmentCreated}
        locations={locations}
        products={products}
      />
=======
      <Card>
        <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-3">
          <Input label="Search" placeholder="Reference, product, or location" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { value: "", label: "All statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "WAITING", label: "Waiting" },
              { value: "READY", label: "Ready" },
              { value: "DONE", label: "Done" },
              { value: "CANCELED", label: "Cancelled" },
            ]}
          />
          <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading locations">
            {([, locations]) => (
              <Select
                label="Location"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                options={[
                  { value: "", label: "All locations" },
                  ...locations.map((location) => ({ value: location.id, label: `${location.code} · ${location.name}` })),
                ]}
              />
            )}
          </QueryState>
        </div>
        <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading adjustments">
          {([operations]) => {
            const q = search.trim().toLowerCase();
            const rows = operations.filter((operation) => {
              const spot = operation.destinationLocationId ?? operation.sourceLocationId;
              if (locationId && spot !== locationId) return false;
              if (!q) return true;
              const counted = operation.items.map((item) => `${item.productName} ${item.sku}`).join(" ");
              return [operation.reference, operation.destinationLocationCode, operation.sourceLocationCode, counted]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q));
            });
            if (rows.length === 0) {
              return <EmptyState title="No adjustments" description="Inventory counts will list the location, counted quantity, and status." />;
            }
            return (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/60">
                      {["Reference", "Location", "Counted", "Created", "Status", ""].map((header) => (
                        <th key={header} className="px-4 py-2 text-xs font-medium text-muted">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((operation) => (
                      <tr key={operation.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2">
                          <Link href={`/adjustments/${operation.id}`} className="font-medium text-accent hover:underline">
                            {operation.reference}
                          </Link>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {operation.destinationLocationCode ?? operation.sourceLocationCode ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          {operation.items.length === 0
                            ? "—"
                            : operation.items.map((item) => `${item.sku} ${item.requestedQuantity}`).join(", ")}
                        </td>
                        <td className="px-4 py-2">{formatTimestamp(operation.createdAt)}</td>
                        <td className="px-4 py-2">
                          <StatusBadge label={formatLabel(operation.status)} tone={tones[operation.status]} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/adjustments/${operation.id}`} className="text-xs text-accent hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }}
        </QueryState>
      </Card>
      {query.status === "ready" && query.data ? (
        <CreateAdjustmentModal
          open={open}
          locations={query.data[1]}
          products={query.data[2]}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            query.reload();
          }}
        />
      ) : null}
>>>>>>> 270621e (feat: complete StockSense inventory management system)
    </div>
  );
}
