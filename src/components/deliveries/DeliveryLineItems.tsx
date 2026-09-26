"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { DeliveryItem, DeliveryOperation, ProductOption } from "./types";

type DeliveryLineItemsProps = {
  operation: DeliveryOperation;
  products: ProductOption[];
  isDraft: boolean;
  onOperationUpdated: (updated: DeliveryOperation) => void;
};

export function DeliveryLineItems({
  operation,
  products,
  isDraft,
  onOperationUpdated,
}: DeliveryLineItemsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  const activeProducts = products.filter((p) => p.isActive);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/operations/${operation.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: quantity,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Failed to add line item.");
      }

      onOperationUpdated(json.data);
      setIsAddOpen(false);
      setSelectedProductId("");
      setQuantity("1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error adding item.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Are you sure you want to remove this line?")) return;

    try {
      const res = await fetch(`/api/operations/${operation.id}/items/${itemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Failed to delete line item.");
      }
      onOperationUpdated(json.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete item.");
    }
  }

  async function handleUpdateItem(itemId: string) {
    const qty = parseFloat(editQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Quantity must be a positive number.");
      return;
    }

    try {
      const res = await fetch(`/api/operations/${operation.id}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: editQuantity }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Failed to update item.");
      }
      onOperationUpdated(json.data);
      setEditingItemId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update item.");
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Operation Lines</h2>
          <p className="mt-0.5 text-xs text-muted">
            Products, demand quantities, and fulfilled counts for this delivery.
          </p>
        </div>
        {isDraft ? (
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            Add Line Item
          </Button>
        ) : null}
      </div>

      {operation.items.length === 0 ? (
        <EmptyState
          title="No lines added"
          description={
            isDraft
              ? "Add products to this delivery before proceeding to Ready."
              : "No line items are associated with this operation."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Product</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">SKU</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-right">Demand</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-right">Done</th>
                {isDraft ? (
                  <th className="px-4 py-2.5 text-xs font-medium text-muted text-right">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {operation.items.map((item) => (
                <tr key={item.id} className="hover:bg-background/40">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {item.productName || "Product"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted font-mono">{item.sku}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {editingItemId === item.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="any"
                          className="h-7 w-20 rounded border border-border bg-card px-2 text-right text-xs"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                        />
                        <button
                          type="button"
                          className="text-xs text-accent hover:underline"
                          onClick={() => handleUpdateItem(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="text-xs text-muted hover:underline"
                          onClick={() => setEditingItemId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold">{item.requestedQuantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-muted">
                    {item.processedQuantity}
                  </td>
                  {isDraft ? (
                    <td className="px-4 py-3 text-right text-xs">
                      {editingItemId !== item.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="text-accent hover:underline"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditQuantity(item.requestedQuantity);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-danger hover:underline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Line Modal */}
      <Modal
        open={isAddOpen}
        title="Add Product Line"
        description="Select a product and the demand quantity to deliver."
        onClose={() => {
          if (!loading) {
            setIsAddOpen(false);
            setError("");
          }
        }}
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          {error ? (
            <div className="rounded-md bg-danger-soft p-3 text-xs text-danger font-medium">
              {error}
            </div>
          ) : null}

          <Select
            label="Product"
            options={[
              { value: "", label: "Choose a product..." },
              ...activeProducts.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.sku})`,
              })),
            ]}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          />

          <Input
            label="Quantity (Demand)"
            type="number"
            min="0.0001"
            step="any"
            placeholder="e.g. 5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsAddOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Line"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
