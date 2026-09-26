"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { createOperation } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import type { AdjustmentOperation, LocationOption, ProductOption } from "./types";

export function CreateAdjustmentModal({
  open,
  onClose,
  onSuccess,
  locations,
  products,
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

  return (
    <Modal
      open={open}
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
          </Button>
        </div>
      </form>
    </Modal>
  );
}
