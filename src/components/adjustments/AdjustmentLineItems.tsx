"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  addOperationItem,
  deleteOperationItem,
  updateOperationItem,
  userFacingMessage,
} from "@/lib/api";
import { formatDifference, formatQuantity, type AdjustmentOperation, type ProductOption } from "./types";

type AdjustmentLineItemsProps = {
  operation: AdjustmentOperation;
  products: ProductOption[];
  isDraft: boolean;
  systemByProduct: Record<string, string>;
  onOperationUpdated: (updated: AdjustmentOperation) => void;
};

export function AdjustmentLineItems({
  operation,
  products,
  isDraft,
  systemByProduct,
  onOperationUpdated,
}: AdjustmentLineItemsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("0");

  const usedProductIds = new Set(operation.items.map((item) => item.productId));
  const activeProducts = products.filter((p) => p.isActive && !usedProductIds.has(p.id));

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (quantity.trim() === "") {
      setError("Enter the physical counted quantity. Zero is allowed.");
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      setError("Counted quantity cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      const updated = await addOperationItem(operation.id, {
        productId: selectedProductId,
        quantity,
      });
      onOperationUpdated(updated);
      setIsAddOpen(false);
      setSelectedProductId("");
      setQuantity("0");
    } catch (err: unknown) {
      setError(userFacingMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Are you sure you want to remove this line?")) return;

    try {
      const updated = await deleteOperationItem(operation.id, itemId);
      onOperationUpdated(updated);
    } catch (err: unknown) {
      alert(userFacingMessage(err));
    }
  }

  async function handleUpdateItem(itemId: string) {
    if (editQuantity.trim() === "") {
      alert("Enter the physical counted quantity. Zero is allowed.");
      return;
    }

    const qty = Number(editQuantity);
    if (!Number.isFinite(qty) || qty < 0) {
      alert("Counted quantity cannot be negative.");
      return;
    }

    try {
      const updated = await updateOperationItem(operation.id, itemId, { quantity: editQuantity });
      onOperationUpdated(updated);
      setEditingItemId(null);
    } catch (err: unknown) {
      alert(userFacingMessage(err));
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Count lines</h2>
          <p className="mt-0.5 text-xs text-muted">
            Physical counted quantity versus live system quantity at this location.
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
              ? "Add a product and counted quantity before marking this adjustment Ready."
              : "No count lines are associated with this operation."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Product</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">SKU</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted">System</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted">Counted</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted">Difference</th>
                {isDraft ? (
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {operation.items.map((item) => {
                const systemQty = systemByProduct[item.productId] ?? "0";
                return (
                  <tr key={item.id} className="hover:bg-background/40">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {item.productName || "Product"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{item.sku}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted">{formatQuantity(systemQty)}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      {editingItemId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
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
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {operation.status === "DONE"
                        ? item.processedQuantity
                        : formatDifference(item.requestedQuantity, systemQty)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={isAddOpen}
        title="Add count line"
        description="Select a product and the physical counted quantity. Zero is allowed."
        onClose={() => {
          if (!loading) {
            setIsAddOpen(false);
            setError("");
          }
        }}
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          {error ? (
            <div className="rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">{error}</div>
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
            label="Physical counted quantity"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            hint="Zero is a valid count."
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
