"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { unitsFrom } from "@/components/products/ProductsList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { QueryState } from "@/components/ui/QueryState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCategories, getProduct, getProducts, updateProduct } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/api/use-api-query";

export function ProductDetail({ productId }: { productId: string }) {
  const load = useCallback(
    () => Promise.all([getProduct(productId), getCategories(), getProducts()]),
    [productId],
  );
  const query = useApiQuery(load, productId);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-4">
      <Link href="/products" className="text-sm text-accent hover:underline">
        ← Back to Products
      </Link>
      <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading product">
        {([product, categories, products]) => (
          <Card className="p-4">
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-xl font-semibold">{product.name}</h1>
              <StatusBadge
                label={product.isActive ? "Active" : "Inactive"}
                tone={product.isActive ? "success" : "neutral"}
              />
            </div>
            {notice ? <p className="mb-3 text-sm text-success">{notice}</p> : null}
            {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setPending(true);
                setError("");
                setNotice("");
                void updateProduct(product.id, {
                  name: String(form.get("name") ?? "").trim(),
                  sku: String(form.get("sku") ?? "").trim(),
                  categoryId: String(form.get("categoryId") ?? ""),
                  unitOfMeasureId: String(form.get("unitOfMeasureId") ?? ""),
                  isActive: form.get("isActive") === "active",
                })
                  .then(() => {
                    setNotice("Product updated.");
                    setPending(false);
                    query.reload();
                  })
                  .catch((err: unknown) => {
                    setError(userFacingMessage(err));
                    setPending(false);
                  });
              }}
            >
              <Input name="name" label="Name" defaultValue={product.name} required />
              <Input name="sku" label="SKU" defaultValue={product.sku} required />
              <Select
                name="categoryId"
                label="Category"
                defaultValue={product.categoryId}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />
              <Select
                name="unitOfMeasureId"
                label="Unit of measure"
                defaultValue={product.unitOfMeasureId}
                options={unitsFrom([product, ...products]).map((unit) => ({
                  value: unit.id,
                  label: unit.code,
                }))}
              />
              <Select
                name="isActive"
                label="Status"
                defaultValue={product.isActive ? "active" : "inactive"}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving" : "Save changes"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
