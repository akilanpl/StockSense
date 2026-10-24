"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
<<<<<<< HEAD
import { LoadingState } from "@/components/ui/LoadingState";
=======
import { QueryState } from "@/components/ui/QueryState";
>>>>>>> 270621e (feat: complete StockSense inventory management system)
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  cancelOperation,
  getOperation,
  getProducts,
<<<<<<< HEAD
  getStock,
  markOperationReady,
  userFacingMessage,
  validateOperation,
} from "@/lib/api";
import { useApiQuery } from "@/lib/api/use-api-query";
import { AdjustmentLineItems } from "./AdjustmentLineItems";
import {
  adjustmentLocationCode,
  adjustmentLocationId,
  canMarkReady,
  canValidate,
  formatDate,
  getStatusBadgeProps,
  isClosed,
  type AdjustmentOperation,
} from "./types";

export function AdjustmentDetailView({ adjustmentId }: { adjustmentId: string }) {
  const [updated, setUpdated] = useState<AdjustmentOperation | null>(null);
  const [stockOverride, setStockOverride] = useState<Record<string, string> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAdjustment = useCallback(async () => {
    const [operation, productList] = await Promise.all([
      getOperation(adjustmentId),
      getProducts(),
    ]);

    if (operation.type !== "ADJUSTMENT") {
      throw new Error("This operation is not an inventory adjustment.");
    }

    const locationId = adjustmentLocationId(operation);
    const stockRows = locationId ? await getStock({ locationId }) : [];
    const nextSystem: Record<string, string> = {};
    for (const row of stockRows) {
      nextSystem[row.productId] = row.quantity;
    }

    return {
      adjustment: operation,
      products: productList,
      systemByProduct: nextSystem,
    };
  }, [adjustmentId]);

  const query = useApiQuery(loadAdjustment, adjustmentId);
  const adjustment =
    updated?.id === adjustmentId ? updated : (query.data?.adjustment ?? null);
  const products = query.data?.products ?? [];
  const systemByProduct =
    updated?.id === adjustmentId && stockOverride
      ? stockOverride
      : (query.data?.systemByProduct ?? {});
  const loading = query.status === "loading" && !adjustment;
  const error = query.status === "error" && !adjustment ? userFacingMessage(query.error) : null;

  function retry() {
    setUpdated(null);
    setStockOverride(null);
    query.reload();
  }

  async function refreshStock(next: AdjustmentOperation) {
    const locId = adjustmentLocationId(next);
    if (!locId) {
      setStockOverride({});
      return;
    }

    const stockRows = await getStock({ locationId: locId });
    const nextSystem: Record<string, string> = {};
    for (const row of stockRows) {
      nextSystem[row.productId] = row.quantity;
    }
    setStockOverride(nextSystem);
  }

  async function handleMarkReady() {
    if (!adjustment) return;
    if (adjustment.items.length === 0) {
      setActionError("Cannot mark as ready: Please add at least one count line first.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const next = await markOperationReady(adjustment.id);
      setUpdated(next);
      await refreshStock(next);
      setActionSuccess("Adjustment marked as Ready for validation.");
    } catch (err: unknown) {
      setActionError(userFacingMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleValidate() {
    if (!adjustment) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const next = await validateOperation(adjustment.id);
      setUpdated(next);
      await refreshStock(next);
      setActionSuccess("Adjustment validated. On-hand quantity has been updated.");
    } catch (err: unknown) {
      setActionError(userFacingMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!adjustment) return;
    if (!confirm("Are you sure you want to cancel this adjustment?")) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const next = await cancelOperation(adjustment.id);
      setUpdated(next);
      setActionSuccess("Adjustment has been cancelled.");
    } catch (err: unknown) {
      setActionError(userFacingMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading adjustment details..." />;
  }

  if (error || !adjustment) {
    return (
      <div className="space-y-4">
        <Link href="/adjustments" className="text-sm text-accent hover:underline">
          ← Back to Adjustments
        </Link>
        <ErrorState
          title="Adjustment not found"
          description={error || "The requested adjustment could not be loaded."}
          onRetry={retry}
        />
      </div>
    );
  }

  const badgeProps = getStatusBadgeProps(adjustment.status);
  const draft = adjustment.status === "DRAFT";
  const ready = canValidate(adjustment.status);
  const closed = isClosed(adjustment.status);
=======
  markOperationReady,
  validateOperation,
} from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/api/use-api-query";
import { formatLabel, formatTimestamp } from "@/lib/format";
import { AdjustmentLineItems } from "./AdjustmentLineItems";
import type { AdjustmentOperation } from "./types";

const tones = {
  DRAFT: "neutral",
  WAITING: "warning",
  READY: "info",
  DONE: "success",
  CANCELED: "danger",
} as const;

export function AdjustmentDetailView({ adjustmentId }: { adjustmentId: string }) {
  const load = useCallback(() => Promise.all([getOperation(adjustmentId), getProducts()]), [adjustmentId]);
  const query = useApiQuery(load, adjustmentId);
  const [adjustment, setAdjustment] = useState<AdjustmentOperation | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [pending, setPending] = useState(false);

  const current = adjustment ?? (query.status === "ready" ? query.data?.[0] : null);
>>>>>>> 270621e (feat: complete StockSense inventory management system)

  return (
    <div className="space-y-4">
      <Link href="/adjustments" className="text-sm text-accent hover:underline">
        ← Back to Adjustments
      </Link>
<<<<<<< HEAD

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{adjustment.reference}</h1>
          <StatusBadge label={badgeProps.label} tone={badgeProps.tone} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canMarkReady(adjustment.status) ? (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={actionLoading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleMarkReady} disabled={actionLoading}>
                {actionLoading ? "Updating..." : "Mark as Ready"}
              </Button>
            </>
          ) : null}

          {ready ? (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={actionLoading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleValidate} disabled={actionLoading}>
                {actionLoading ? "Validating..." : "Validate"}
              </Button>
            </>
          ) : null}

          {closed ? <span className="text-xs text-muted">This adjustment is closed.</span> : null}
        </div>
      </div>

      {actionError ? (
        <div className="rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">{actionError}</div>
      ) : null}
      {actionSuccess ? (
        <div className="rounded-md bg-success-soft p-3 text-xs font-medium text-success">{actionSuccess}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Operation Details</h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Created by</dt>
              <dd className="text-foreground">{adjustment.createdByName || "System"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Created Date</dt>
              <dd className="text-foreground">{formatDate(adjustment.createdAt)}</dd>
            </div>
            {adjustment.validatedAt ? (
              <div className="flex justify-between py-2">
                <dt className="text-xs text-muted">Validated Date</dt>
                <dd className="font-medium text-success">{formatDate(adjustment.validatedAt)}</dd>
              </div>
            ) : null}
            {adjustment.canceledAt ? (
              <div className="flex justify-between py-2">
                <dt className="text-xs text-muted">Canceled Date</dt>
                <dd className="font-medium text-danger">{formatDate(adjustment.canceledAt)}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Count location</h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Location</dt>
              <dd className="font-medium text-foreground">{adjustmentLocationCode(adjustment)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Operation Type</dt>
              <dd className="font-medium text-foreground">Inventory Adjustment</dd>
            </div>
          </dl>
        </Card>
      </div>

      <AdjustmentLineItems
        operation={adjustment}
        products={products}
        isDraft={draft}
        systemByProduct={systemByProduct}
        onOperationUpdated={async (next) => {
          setUpdated(next);
          await refreshStock(next);
        }}
      />
=======
      <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading adjustment">
        {([loaded, products]) => {
          const operation = current && current.id === loaded.id ? current : loaded;
          if (operation.type !== "ADJUSTMENT") {
            return <ErrorState title="Not an adjustment" description="This operation is not an inventory count." />;
          }
          const location = operation.destinationLocationCode ?? operation.sourceLocationCode ?? "—";
          const draft = operation.status === "DRAFT" || operation.status === "WAITING";
          const ready = operation.status === "READY";
          return (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">{operation.reference}</h1>
                  <StatusBadge label={formatLabel(operation.status)} tone={tones[operation.status]} />
                </div>
                <div className="flex gap-2">
                  {draft ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setPending(true);
                        setActionError("");
                        void markOperationReady(operation.id)
                          .then((updated) => {
                            setAdjustment(updated);
                            setActionNotice("Adjustment is ready to validate.");
                            setPending(false);
                          })
                          .catch((err: unknown) => {
                            setActionError(userFacingMessage(err));
                            setPending(false);
                          });
                      }}
                    >
                      Mark ready
                    </Button>
                  ) : null}
                  {ready ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setPending(true);
                        setActionError("");
                        void validateOperation(operation.id)
                          .then((updated) => {
                            setAdjustment(updated);
                            setActionNotice("Adjustment validated. Stock was updated by the server.");
                            setPending(false);
                          })
                          .catch((err: unknown) => {
                            setActionError(userFacingMessage(err));
                            setPending(false);
                          });
                      }}
                    >
                      Validate
                    </Button>
                  ) : null}
                  {draft || ready ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm("Cancel this adjustment?")) return;
                        setPending(true);
                        void cancelOperation(operation.id)
                          .then((updated) => {
                            setAdjustment(updated);
                            setActionNotice("Adjustment cancelled.");
                            setPending(false);
                          })
                          .catch((err: unknown) => {
                            setActionError(userFacingMessage(err));
                            setPending(false);
                          });
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
              {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
              {actionNotice ? <p className="text-sm text-success">{actionNotice}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <h2 className="text-sm font-semibold">Operation</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd>{operation.status}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Created</dt><dd>{formatTimestamp(operation.createdAt)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Validated</dt><dd>{operation.validatedAt ? formatTimestamp(operation.validatedAt) : "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Created by</dt><dd>{operation.createdByName}</dd></div>
                  </dl>
                </Card>
                <Card className="p-4">
                  <h2 className="text-sm font-semibold">Location</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-muted">Counted at</dt><dd className="font-mono text-xs">{location}</dd></div>
                  </dl>
                </Card>
              </div>
              <AdjustmentLineItems
                operation={operation}
                products={products}
                isDraft={operation.status === "DRAFT"}
                onOperationUpdated={setAdjustment}
              />
            </>
          );
        }}
      </QueryState>
>>>>>>> 270621e (feat: complete StockSense inventory management system)
    </div>
  );
}
