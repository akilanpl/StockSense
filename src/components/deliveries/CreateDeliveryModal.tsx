"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { DeliveryOperation, LocationOption, ProductOption } from "./types";

type CreateDeliveryModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (delivery: DeliveryOperation) => void;
  locations: LocationOption[];
  products: ProductOption[];
  defaultUserId?: string;
};

const DEV_CUSTOMER_ID = "00000000-0000-4000-8000-0000000000a2";

export function CreateDeliveryModal({
  open,
  onClose,
  onSuccess,
  locations,
  products,
  defaultUserId,
}: CreateDeliveryModalProps) {
  const [reference, setReference] = useState("");
  const [partnerId, setPartnerId] = useState(DEV_CUSTOMER_ID);
  const [sourceLocationId, setSourceLocationId] = useState(locations[0]?.id || "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [createdById, setCreatedById] = useState(defaultUserId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeLocations = locations.filter((loc) => loc.isActive);
  const activeProducts = products.filter((prod) => prod.isActive);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const locId = sourceLocationId || activeLocations[0]?.id;
    if (!locId) {
      setError("Please select a source location.");
      return;
    }

    const userId = (createdById || defaultUserId || "").trim();
    if (!userId) {
      setError("A valid creator user ID is required. Please check system user setup.");
      return;
    }

    let itemsPayload: Array<{ productId: string; quantity: string }> = [];
    if (productId) {
      const parsedQty = parseFloat(quantity);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        setError("Quantity must be a positive number.");
        return;
      }
      itemsPayload = [{ productId, quantity }];
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        type: "DELIVERY",
        sourceLocationId: locId,
        createdById: userId,
      };

      if (reference.trim()) {
        payload.reference = reference.trim();
      }

      if (partnerId.trim()) {
        payload.partnerId = partnerId.trim();
      }

      if (itemsPayload.length > 0) {
        payload.items = itemsPayload;
      }

      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Failed to create delivery.");
      }

      // Store successfully used user ID for convenience
      try {
        localStorage.setItem("stocksense_user_id", userId);
      } catch {
        // ignore localStorage access issues
      }

      onSuccess(json.data);
      onClose();
      // Reset form
      setReference("");
      setProductId("");
      setQuantity("1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create Delivery"
      description="Create a new outgoing stock operation from a warehouse location."
      onClose={() => {
        if (!loading) {
          setError("");
          onClose();
        }
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">
            {error}
          </div>
        ) : null}

        <Input
          label="Reference"
          placeholder="Leave blank for auto-generated number (e.g. WH/OUT/00001)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          hint="Optional document reference"
        />

        <Select
          label="Source Location"
          options={[
            { value: "", label: "Select a source location..." },
            ...activeLocations.map((loc) => ({
              value: loc.id,
              label: `${loc.name} (${loc.code})`,
            })),
          ]}
          value={sourceLocationId || activeLocations[0]?.id || ""}
          onChange={(e) => setSourceLocationId(e.target.value)}
        />

        <Input
          label="Customer / Partner ID"
          placeholder="Customer UUID"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          hint="Default test customer pre-filled"
        />

        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Initial Line Item (Optional)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Product"
              options={[
                { value: "", label: "None (Add lines later)" },
                ...activeProducts.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.sku})`,
                })),
              ]}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
            <Input
              label="Quantity"
              type="number"
              min="0.0001"
              step="any"
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!productId}
            />
          </div>
        </div>

        {/* User ID field if not auto-detected */}
        {!defaultUserId ? (
          <Input
            label="Created By User ID"
            placeholder="User UUID"
            value={createdById}
            onChange={(e) => setCreatedById(e.target.value)}
            hint="UUID of active user"
          />
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Save Draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
