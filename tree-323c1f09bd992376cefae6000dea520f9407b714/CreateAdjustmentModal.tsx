"use client";

<<<<<<< HEAD
import { useCallback, useState } from "react";
=======
import { useState } from "react";
>>>>>>> 270621e (feat: complete StockSense inventory management system)
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
<<<<<<< HEAD
import { createOperation, getStock, userFacingMessage } from "@/lib/api";
import { useApiQuery } from "@/lib/api/use-api-query";
import {
  formatDifference,
  formatQuantity,
  type AdjustmentOperation,
  type LocationOption,
  type ProductOption,
} from "./types";

type CreateAdjustmentModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (adjustment: AdjustmentOperation) => void;
  locations: LocationOption[];
  products: ProductOption[];
};
=======
import { createOperation } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import type { AdjustmentOperation, LocationOption, ProductOption } from "./types";
>>>>>>> 270621e (feat: complete StockSense inventory management system)

export function CreateAdjustmentModal({
  open,
  onClose,
  onSuccess,
  locations,
  products,
<<<<<<< HEAD
}: CreateAdjustmentModalProps) {
  const [reference, setReference] = useState("");
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [countedQuantity, setCountedQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeLocations = locations.filter((loc) => loc.isActive);
  const activeProducts = products.filter((prod) => prod.isActive);
  const canLoadStock = open && Boolean(productId) && Boolean(locationId);

  const loadStock = useCallback(async () => {
    if (!open || !productId || !locationId) {
      return null;
    }

    const rows = await getStock({ productId, locationId });
    return rows[0]?.quantity ?? "0";
  }, [open, productId, locationId]);

  const stockQuery = useApiQuery(loadStock, canLoadStock ? `${productId}:${locationId}` : "idle");
  const systemQuantity = canLoadStock && stockQuery.status === "ready" ? stockQuery.data : null;
  const stockLoading = canLoadStock && stockQuery.status === "loading";
  const stockError =
    canLoadStock && stockQuery.status === "error" ? userFacingMessage(stockQuery.error) : "";

  function resetForm() {
    setReference("");
    setProductId("");
    setLocationId("");
    setCountedQuantity("0");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (!locationId) {
      setError("Please select a location.");
      return;
    }

    if (countedQuantity.trim() === "") {
      setError("Enter the physical counted quantity. Zero is allowed.");
      return;
    }

    const counted = Number(countedQuantity);
    if (!Number.isFinite(counted) || counted < 0) {
      setError("Counted quantity cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      const adjustment = await createOperation({
        type: "ADJUSTMENT",
        sourceLocationId: locationId,
        items: [{ productId, quantity: countedQuantity }],
        ...(reference.trim() ? { reference: reference.trim() } : {}),
      });

      resetForm();
      onSuccess(adjustment);
      onClose();
    } catch (err: unknown) {
      setError(userFacingMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const systemDisplay = !productId || !locationId
    ? "Select a product and location"
    : stockLoading
      ? "Loading on-hand quantity..."
      : stockError
        ? stockError
        : formatQuantity(systemQuantity, "0");

  const differenceDisplay =
    productId && locationId && !stockLoading && !stockError
      ? formatDifference(countedQuantity, systemQuantity)
      : "—";
=======
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (adjustment: AdjustmentOperation) => void;
  locations: LocationOption[];
  products: ProductOption[];
}) {
  const spots = locations.filter((location) => location.isActive && location.type === "INTERNAL");
  const [reference, setReference] = useState("");
  const [locationId, setLocationId] = useState(spots[0]?.id ?? "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
>>>>>>> 270621e (feat: complete StockSense inventory management system)

  return (
    <Modal
      open={open}
<<<<<<< HEAD
      title="Create Adjustment"
      description="Record a physical count for one product at one location. Counted quantity may be zero."
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
          placeholder="Leave blank for auto-generated number (e.g. ADJ/00001)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          hint="Optional document reference"
        />

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

        <Select
          label="Location"
          options={[
            { value: "", label: "Select a location..." },
            ...activeLocations.map((loc) => ({
              value: loc.id,
              label: `${loc.name} (${loc.code})`,
            })),
          ]}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background/60 px-3 py-2">
            <p className="text-xs font-medium text-muted">System quantity</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{systemDisplay}</p>
            <p className="mt-1 text-xs text-muted">On-hand quantity from live stock.</p>
          </div>
          <Input
            label="Physical counted quantity"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={countedQuantity}
            onChange={(e) => setCountedQuantity(e.target.value)}
            hint="Zero is a valid count."
          />
        </div>

        <p className="text-xs text-muted">
          Difference: <span className="font-medium text-foreground">{differenceDisplay}</span>
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || stockLoading}>
            {loading ? "Creating..." : "Save Draft"}
=======
      title="Create adjustment"
      description="Save a counted quantity as a draft. Stock changes only when the adjustment is validated."
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const chosen = locationId || spots[0]?.id;
          if (!chosen) {
            setError("Choose a location.");
            return;
          }
          if (productId && (Number(quantity) < 0 || Number.isNaN(Number(quantity)))) {
            setError("Counted quantity cannot be negative.");
            return;
          }
          setPending(true);
          setError("");
          void createOperation({
            type: "ADJUSTMENT",
            destinationLocationId: chosen,
            reference: reference.trim() || undefined,
            items: productId ? [{ productId, quantity }] : undefined,
          })
            .then((adjustment) => {
              onSuccess(adjustment);
              onClose();
              setReference("");
              setProductId("");
              setQuantity("0");
              setPending(false);
            })
            .catch((err: unknown) => {
              setError(userFacingMessage(err));
              setPending(false);
            });
        }}
      >
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Input label="Reference" hint="Optional. A reference is generated when this is blank." value={reference} onChange={(event) => setReference(event.target.value)} />
        <Select
          label="Location"
          value={locationId || spots[0]?.id || ""}
          onChange={(event) => setLocationId(event.target.value)}
          options={spots.map((location) => ({
            value: location.id,
            label: `${location.name} (${location.code})`,
          }))}
        />
        <Select
          label="Product"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          options={[
            { value: "", label: "Add lines later" },
            ...products.filter((product) => product.isActive).map((product) => ({
              value: product.id,
              label: `${product.name} (${product.sku})`,
            })),
          ]}
        />
        <Input
          label="Counted quantity"
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={!productId}
          hint="This is the quantity you counted, including zero."
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save draft"}
>>>>>>> 270621e (feat: complete StockSense inventory management system)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
