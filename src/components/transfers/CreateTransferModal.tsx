"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { createOperation, userFacingMessage } from "@/lib/api";
import type { LocationOption, ProductOption, TransferOperation } from "./types";

type CreateTransferModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (transfer: TransferOperation) => void;
  locations: LocationOption[];
  products: ProductOption[];
};

export function CreateTransferModal({
  open,
  onClose,
  onSuccess,
  locations,
  products,
}: CreateTransferModalProps) {
  const [reference, setReference] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeLocations = locations.filter((loc) => loc.isActive);
  const activeProducts = products.filter((prod) => prod.isActive);

  function resetForm() {
    setReference("");
    setSourceLocationId("");
    setDestinationLocationId("");
    setProductId("");
    setQuantity("1");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!sourceLocationId) {
      setError("Please select a source location.");
      return;
    }

    if (!destinationLocationId) {
      setError("Please select a destination location.");
      return;
    }

    if (sourceLocationId === destinationLocationId) {
      setError("Source and destination locations must be different.");
      return;
    }

    if (!productId) {
      setError("Please select a product to transfer.");
      return;
    }

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    setLoading(true);

    try {
      const transfer = await createOperation({
        type: "TRANSFER",
        sourceLocationId,
        destinationLocationId,
        items: [{ productId, quantity }],
        ...(reference.trim() ? { reference: reference.trim() } : {}),
      });

      onSuccess(transfer);
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(userFacingMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create Transfer"
      description="Move stock from one location to another inside the warehouse."
      onClose={() => {
        if (!loading) {
          setError("");
          onClose();
        }
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">{error}</div>
        ) : null}

        <Input
          label="Reference"
          placeholder="Leave blank for auto-generated number (e.g. TRF/00001)"
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
          value={sourceLocationId}
          onChange={(e) => setSourceLocationId(e.target.value)}
        />

        <Select
          label="Destination Location"
          options={[
            { value: "", label: "Select a destination location..." },
            ...activeLocations.map((loc) => ({
              value: loc.id,
              label: `${loc.name} (${loc.code})`,
            })),
          ]}
          value={destinationLocationId}
          onChange={(e) => setDestinationLocationId(e.target.value)}
        />

        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Product line</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Product"
              options={[
                { value: "", label: "Select a product..." },
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
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
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
