"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeliveryLineItems } from "./DeliveryLineItems";
import {
  type DeliveryOperation,
  type ProductOption,
  formatDate,
  getStatusBadgeProps,
} from "./types";

export function DeliveryDetailView({ deliveryId }: { deliveryId: string }) {
  const [delivery, setDelivery] = useState<DeliveryOperation | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState(deliveryId);

  if (loadedId !== deliveryId) {
    setLoadedId(deliveryId);
    setLoading(true);
    setError(null);
    setDelivery(null);
  }

  const loadDelivery = useCallback(async () => {
    const [opRes, prodRes] = await Promise.all([
      fetch(`/api/operations/${deliveryId}`),
      fetch("/api/products"),
    ]);

    const opJson = await opRes.json();
    if (!opRes.ok || !opJson.ok) {
      throw new Error(opJson.error?.message || "Delivery was not found.");
    }

    let nextProducts: ProductOption[] | null = null;
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      if (prodJson.ok && Array.isArray(prodJson.data)) {
        nextProducts = prodJson.data;
      }
    }

    return { delivery: opJson.data as DeliveryOperation, nextProducts };
  }, [deliveryId]);

  const applyDelivery = useCallback((result: Awaited<ReturnType<typeof loadDelivery>>) => {
    setDelivery(result.delivery);
    if (result.nextProducts) {
      setProducts(result.nextProducts);
    }
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    loadDelivery()
      .then((result) => {
        if (active) {
          applyDelivery(result);
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load delivery.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyDelivery, loadDelivery]);

  function retry() {
    setLoading(true);
    setError(null);
    void loadDelivery().then(applyDelivery).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load delivery.");
      setLoading(false);
    });
  }

  async function handleMarkReady() {
    if (!delivery) return;
    if (delivery.items.length === 0) {
      setActionError("Cannot mark as ready: Please add at least one product line item first.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/operations/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Failed to mark delivery as Ready.");
      }

      setDelivery(json.data);
      setActionSuccess("Delivery marked as Ready for validation.");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update delivery status.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleValidate() {
    if (!delivery) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/operations/${delivery.id}/validate`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Validation failed. Check available stock.");
      }

      setDelivery(json.data);
      setActionSuccess("Delivery successfully validated and inventory has been moved!");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to validate delivery.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!delivery) return;
    if (!confirm("Are you sure you want to cancel this delivery operation?")) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/operations/${delivery.id}/cancel`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Failed to cancel delivery.");
      }

      setDelivery(json.data);
      setActionSuccess("Delivery has been cancelled.");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel delivery.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading delivery details..." />;
  }

  if (error || !delivery) {
    return (
      <div className="space-y-4">
        <Link href="/deliveries" className="text-sm text-accent hover:underline">
          ← Back to Deliveries
        </Link>
        <ErrorState
          title="Delivery not found"
          description={error || "The requested delivery operation could not be loaded."}
          onRetry={retry}
        />
      </div>
    );
  }

  const badgeProps = getStatusBadgeProps(delivery.status);
  const isDraft = delivery.status === "DRAFT";
  const isReady = delivery.status === "READY";
  const isClosed = delivery.status === "DONE" || delivery.status === "CANCELED";

  return (
    <div className="space-y-4">
      <Link href="/deliveries" className="text-sm text-accent hover:underline">
        ← Back to Deliveries
      </Link>

      {/* Header with Title and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {delivery.reference}
          </h1>
          <StatusBadge label={badgeProps.label} tone={badgeProps.tone} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleMarkReady}
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Mark as Ready"}
              </Button>
            </>
          ) : null}

          {isReady ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleValidate}
                disabled={actionLoading}
              >
                {actionLoading ? "Validating..." : "Validate"}
              </Button>
            </>
          ) : null}

          {isClosed ? (
            <span className="text-xs text-muted">This delivery is closed.</span>
          ) : null}
        </div>
      </div>

      {/* Feedback Messages */}
      {actionError ? (
        <div className="rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="rounded-md bg-success-soft p-3 text-xs font-medium text-success">
          {actionSuccess}
        </div>
      ) : null}

      {/* Information Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Operation Details</h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Deliver to</dt>
              <dd className="font-medium text-foreground">{delivery.partnerName || "Customer"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Created by</dt>
              <dd className="text-foreground">{delivery.createdByName || "System"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Created Date</dt>
              <dd className="text-foreground">{formatDate(delivery.createdAt)}</dd>
            </div>
            {delivery.validatedAt ? (
              <div className="flex justify-between py-2">
                <dt className="text-xs text-muted">Validated Date</dt>
                <dd className="text-success font-medium">{formatDate(delivery.validatedAt)}</dd>
              </div>
            ) : null}
            {delivery.canceledAt ? (
              <div className="flex justify-between py-2">
                <dt className="text-xs text-muted">Canceled Date</dt>
                <dd className="text-danger font-medium">{formatDate(delivery.canceledAt)}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Route & Destination</h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Source Location</dt>
              <dd className="font-medium text-foreground">
                {delivery.sourceLocationCode || "Warehouse Stock"}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Destination Location</dt>
              <dd className="text-muted">Customer Partner Location</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-xs text-muted">Operation Type</dt>
              <dd className="font-medium text-foreground">Outgoing Delivery</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Line Items Management */}
      <DeliveryLineItems
        operation={delivery}
        products={products}
        isDraft={isDraft}
        onOperationUpdated={setDelivery}
      />
    </div>
  );
}
