"use client";

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
import { getLocations, getOperations, getProducts, getWarehouses } from "@/lib/api";
import { useApiQuery } from "@/lib/api/use-api-query";
import { formatLabel, formatTimestamp } from "@/lib/format";
import { CreateReceiptModal } from "./CreateReceiptModal";
import type { ReceiptOperation } from "./types";

const tones = {
  DRAFT: "neutral",
  WAITING: "warning",
  READY: "info",
  DONE: "success",
  CANCELED: "danger",
} as const;

export function ReceiptsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [open, setOpen] = useState(false);
  const load = useCallback(
    () =>
      Promise.all([
        getOperations({
          type: "RECEIPT",
          status: status ? (status as ReceiptOperation["status"]) : undefined,
          warehouseId: warehouseId || undefined,
          destinationLocationId: destinationLocationId || undefined,
        }),
        getLocations(),
        getProducts(),
        getWarehouses(),
      ]),
    [status, warehouseId, destinationLocationId],
  );
  const query = useApiQuery(load, `${status}|${warehouseId}|${destinationLocationId}`);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Receipts"
        description="Incoming operations that bring stock into a location when validated."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Create Receipt
          </Button>
        }
      />
      <Card>
        <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Search" placeholder="Reference, supplier, or location" value={search} onChange={(event) => setSearch(event.target.value)} />
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
          <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading filters">
            {([, locations, , warehouses]) => (
              <>
                <Select
                  label="Warehouse"
                  value={warehouseId}
                  onChange={(event) => {
                    setWarehouseId(event.target.value);
                    setDestinationLocationId("");
                  }}
                  options={[{ value: "", label: "All warehouses" }, ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))]}
                />
                <Select
                  label="Destination"
                  value={destinationLocationId}
                  onChange={(event) => setDestinationLocationId(event.target.value)}
                  options={[
                    { value: "", label: "All destinations" },
                    ...locations
                      .filter((location) => !warehouseId || location.warehouseId === warehouseId)
                      .map((location) => ({ value: location.id, label: `${location.code} · ${location.name}` })),
                  ]}
                />
              </>
            )}
          </QueryState>
        </div>
        <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading receipts">
          {([operations]) => {
            const q = search.trim().toLowerCase();
            const rows = operations.filter((operation) => {
              if (!q) return true;
              return [operation.reference, operation.partnerName, operation.destinationLocationCode]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q));
            });
            if (rows.length === 0) {
              return <EmptyState title="No receipts" description="Incoming receipts will show their supplier, destination, and status." />;
            }
            return (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/60">
                      {["Reference", "Supplier", "Destination", "Created", "Status", ""].map((header) => (
                        <th key={header} className="px-4 py-2 text-xs font-medium text-muted">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((operation) => (
                      <tr key={operation.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2">
                          <Link href={`/receipts/${operation.id}`} className="font-medium text-accent hover:underline">
                            {operation.reference}
                          </Link>
                        </td>
                        <td className="px-4 py-2">{operation.partnerName ?? "—"}</td>
                        <td className="px-4 py-2 font-mono text-xs">{operation.destinationLocationCode ?? "—"}</td>
                        <td className="px-4 py-2">{formatTimestamp(operation.createdAt)}</td>
                        <td className="px-4 py-2">
                          <StatusBadge label={formatLabel(operation.status)} tone={tones[operation.status]} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/receipts/${operation.id}`} className="text-xs text-accent hover:underline">
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
        <CreateReceiptModal
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
    </div>
  );
}
