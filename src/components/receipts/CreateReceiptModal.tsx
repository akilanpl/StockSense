"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApiQuery } from "@/lib/api/use-api-query";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { type LocationOption, type ProductOption, type ReceiptOperation } from "./types";
import { createOperation, getPartners } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";

export function CreateReceiptModal({
  open,
  onClose,
  onSuccess,
  locations,
  products,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (receipt: ReceiptOperation) => void;
  locations: LocationOption[];
  products: ProductOption[];
}) {
  const destinations = locations.filter((location) => location.isActive && location.type === "INTERNAL");
  const loadPartners = useCallback(() => getPartners("SUPPLIER"), []);
  const partners = useApiQuery(loadPartners);
  const [reference, setReference] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState(destinations[0]?.id ?? "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Modal
      open={open}
      title="Create receipt"
      description="Save an incoming draft. Stock changes only when the receipt is validated."
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const locationId = destinationLocationId || destinations[0]?.id;
          if (!locationId) {
            setError("Choose a destination location.");
            return;
          }
          if (productId && (Number(quantity) <= 0 || Number.isNaN(Number(quantity)))) {
            setError("Quantity must be greater than zero.");
            return;
          }
          setPending(true);
          setError("");
          void createOperation({
            type: "RECEIPT",
            destinationLocationId: locationId,
            reference: reference.trim() || undefined,
            partnerId: partnerId || null,
            items: productId ? [{ productId, quantity }] : undefined,
          })
            .then((receipt) => {
              onSuccess(receipt);
              onClose();
              setReference("");
              setProductId("");
              setQuantity("1");
              setPending(false);
            })
            .catch((err: unknown) => {
              setError(userFacingMessage(err));
              setPending(false);
            });
        }}
      >
        {partners.status === "error" ? <p role="alert" className="text-xs text-danger">Partners could not load. <button type="button" onClick={partners.reload}>Retry</button></p> : null}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Input label="Reference" hint="Optional. A reference is generated when this is blank." value={reference} onChange={(event) => setReference(event.target.value)} />
        <Select
          label="Supplier"
          disabled={partners.status !== "ready"}
          value={partnerId}
          onChange={(event) => setPartnerId(event.target.value)}
          options={[
            { value: "", label: "No supplier" },
            ...(partners.data ?? []).map((partner) => ({ value: partner.id, label: partner.name })),
          ]}
        />
        <Select
          label="Destination location"
          value={destinationLocationId || destinations[0]?.id || ""}
          onChange={(event) => setDestinationLocationId(event.target.value)}
          options={destinations.map((location) => ({
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
        <Input label="Quantity" type="number" min="0.0001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={!productId} />
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
