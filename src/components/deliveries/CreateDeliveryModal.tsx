"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { createOperation } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import type { DeliveryOperation, LocationOption, ProductOption } from "./types";

type CreateDeliveryModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (delivery: DeliveryOperation) => void;
  locations: LocationOption[];
  products: ProductOption[];
};

const SEEDED_CUSTOMER = {
  id: "00000000-0000-4000-8000-0000000000a2",
  name: "DEV Customer",
};

export function CreateDeliveryModal({
  open,
  onClose,
  onSuccess,
  locations,
  products,
}: CreateDeliveryModalProps) {
  const [reference, setReference] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState(locations[0]?.id || "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
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
      const delivery = await createOperation({
        type: "DELIVERY",
        sourceLocationId: locId,
        reference: reference.trim() || undefined,
        partnerId: partnerId || null,
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
      });

      if (delivery.type !== "DELIVERY") {
        throw new Error("Created operation was not a delivery.");
      }

      onSuccess(delivery as DeliveryOperation);
      onClose();
      // Reset form
      setReference("");
      setProductId("");
      setQuantity("1");
    } catch (err: unknown) {
      setError(userFacingMessage(err));
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

        <Select
          label="Customer"
          value={partnerId}
          onChange={(event) => setPartnerId(event.target.value)}
          options={[
            { value: "", label: "No customer" },
            { value: SEEDED_CUSTOMER.id, label: SEEDED_CUSTOMER.name },
          ]}
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
