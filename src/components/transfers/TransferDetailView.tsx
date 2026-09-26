"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  cancelOperation,
  getOperation,
  getProducts,
  markOperationReady,
  userFacingMessage,
  validateOperation,
} from "@/lib/api";
import { TransferLineItems } from "./TransferLineItems";
import {
  canMarkReady,
  canValidate,
  formatDate,
  formatLocation,
  getStatusBadgeProps,
  isClosed,
  type ProductOption,
  type TransferOperation,
} from "./types";

export function TransferDetailView({ transferId }: { transferId: string }) {
  const [transfer, setTransfer] = useState<TransferOperation | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchTransfer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [operation, productList] = await Promise.all([getOperation(transferId), getProducts()]);

      if (operation.type !== "TRANSFER") {
        throw new Error("This operation is not an internal transfer.");
      }

      setTransfer(operation);
      setProducts(productList);
    } catch (err: unknown) {
      setError(userFacingMessage(err));
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  async function handleMarkReady() {
    if (!transfer) return;
    if (transfer.items.length === 0) {
      setActionError("Cannot mark as ready: Please add at least one product line item first.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await markOperationReady(transfer.id);
      setTransfer(updated);
      setActionSuccess("Transfer marked as Ready for validation.");
    } catch (err: unknown) {
      setActionError(userFacingMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleValidate() {
    if (!transfer) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await validateOperation(transfer.id);
      setTransfer(updated);
      setActionSuccess("Transfer validated. Inventory has been moved.");
    } catch (err: unknown) {
      setActionError(userFacingMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!transfer) return;
    if (!confirm("Are you sure you want to cancel this transfer?")) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await cancelOperation(transfer.id);
      setTransfer(updated);
      setActionSuccess("Transfer has been cancelled.");
    } catch (err: unknown) {
      setActionError(userFacingMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading transfer details..." />;
  }

  if (error || !transfer) {
    return (
      <div className="space-y-4">
        <Link href="/transfers" className="text-sm text-accent hover:underline">
          ← Back to Transfers
        </Link>
        <ErrorState
          title="Transfer not found"
          description={error || "The requested transfer operation could not be loaded."}
          onRetry={fetchTransfer}
        />
      </div>
    );
  }

  const badgeProps = getStatusBadgeProps(transfer.status);
  const draft = transfer.status === "DRAFT";
  const ready = canValidate(transfer.status);
  const closed = isClosed(transfer.status);

  return (
    <div className="space-y-4">
      <Link href="/transfers" className="text-sm text-accent hover:underline">
        ← Back to Transfers
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{transfer.reference}</h1>
          <StatusBadge label={badgeProps.label} tone={badgeProps.tone} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canMarkReady(transfer.status) ? (
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

          {closed ? <span className="text-xs text-muted">This transfer is closed.</span> : null}
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
              <dd className="text-foreground">{transfer.createdByName || "System"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Created Date</dt>
              <dd className="text-foreground">{formatDate(transfer.createdAt)}</dd>
            </div>
            {transfer.validatedAt ? (
              <div className="flex justify-between py-2">
                <dt className="text-xs text-muted">Validated Date</dt>
                <dd className="font-medium text-success">{formatDate(transfer.validatedAt)}</dd>
              </div>
            ) : null}
            {transfer.canceledAt ? (
              <div className="flex justify-between py-2">
                <dt className="text-xs text-muted">Canceled Date</dt>
                <dd className="font-medium text-danger">{formatDate(transfer.canceledAt)}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Route</h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Source Location</dt>
              <dd className="font-medium text-foreground">{formatLocation(transfer.sourceLocationCode)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Destination Location</dt>
              <dd className="font-medium text-foreground">
                {formatLocation(transfer.destinationLocationCode)}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Operation Type</dt>
              <dd className="font-medium text-foreground">Internal Transfer</dd>
            </div>
          </dl>
        </Card>
      </div>

      <TransferLineItems
        operation={transfer}
        products={products}
        isDraft={draft}
        onOperationUpdated={setTransfer}
      />
    </div>
  );
}
