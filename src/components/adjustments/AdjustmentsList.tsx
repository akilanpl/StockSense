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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Adjustments"
        description="Counted corrections that raise or lower on-hand quantity at one location."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Create Adjustment
          </Button>
        }
      />
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
    </div>
  );
}
