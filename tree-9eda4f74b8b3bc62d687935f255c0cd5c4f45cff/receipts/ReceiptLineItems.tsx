"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { addOperationItem, deleteOperationItem, updateOperationItem } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import type { ProductOption, ReceiptOperation } from "./types";

export function ReceiptLineItems({
  operation,
  products,
  isDraft,
  onOperationUpdated,
}: {
  operation: ReceiptOperation;
  products: ProductOption[];
  isDraft: boolean;
  onOperationUpdated: (operation: ReceiptOperation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Operation lines</h2>
          <p className="mt-0.5 text-xs text-muted">Requested and processed quantities for this receipt.</p>
        </div>
        {isDraft ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            Add line
          </Button>
        ) : null}
      </div>
      {operation.items.length === 0 ? (
        <EmptyState title="No lines added" description="Add at least one product before marking this receipt ready." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="px-4 py-2 text-xs font-medium text-muted">Product</th>
                <th className="px-4 py-2 text-xs font-medium text-muted">SKU</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted">Requested</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted">Processed</th>
                {isDraft ? <th className="px-4 py-2 text-right text-xs font-medium text-muted">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {operation.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2">{item.productName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-2 text-right">
                    {editingId === item.id ? (
                      <span className="inline-flex items-center gap-2">
                        <input
                          className="h-8 w-20 rounded-md border border-border px-2 text-right text-sm"
                          value={editQuantity}
                          onChange={(event) => setEditQuantity(event.target.value)}
                        />
                        <button
                          type="button"
                          className="text-xs text-accent"
                          onClick={() => {
                            void updateOperationItem(operation.id, item.id, { quantity: editQuantity })
                              .then((updated) => {
                                onOperationUpdated(updated);
                                setEditingId(null);
                              })
                              .catch((err: unknown) => alert(userFacingMessage(err)));
                          }}
                        >
                          Save
                        </button>
                      </span>
                    ) : (
                      item.requestedQuantity
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{item.processedQuantity}</td>
                  {isDraft ? (
                    <td className="px-4 py-2 text-right text-xs">
                      <button
                        type="button"
                        className="mr-2 text-accent"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditQuantity(item.requestedQuantity);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-danger"
                        onClick={() => {
                          if (!confirm("Remove this line?")) return;
                          void deleteOperationItem(operation.id, item.id)
                            .then(onOperationUpdated)
                            .catch((err: unknown) => alert(userFacingMessage(err)));
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title="Add product line" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!productId || Number(quantity) <= 0) {
              setError("Choose a product and a quantity greater than zero.");
              return;
            }
            setPending(true);
            void addOperationItem(operation.id, { productId, quantity })
              .then((updated) => {
                onOperationUpdated(updated);
                setOpen(false);
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
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Select
            label="Product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            options={[
              { value: "", label: "Choose a product" },
              ...products.filter((product) => product.isActive).map((product) => ({
                value: product.id,
                label: `${product.name} (${product.sku})`,
              })),
            ]}
          />
          <Input label="Quantity" type="number" min="0.0001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding" : "Add line"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
