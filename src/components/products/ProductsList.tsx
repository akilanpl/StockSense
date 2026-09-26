"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { QueryState } from "@/components/ui/QueryState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createCategory, createProduct, getCategories, getProducts } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/api/use-api-query";
import { columns } from "@/lib/columns";
import type { Category, Product } from "@/types/api";

export function ProductsList() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () =>
      Promise.all([
        getProducts({
          q: search.trim() || undefined,
          categoryId: categoryId || undefined,
        }),
        getCategories(),
        getProducts(),
      ]),
    [search, categoryId],
  );
  const query = useApiQuery(load, `${search}|${categoryId}`);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="Catalog of stockable items used by receipts, deliveries, transfers, and adjustments."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Add Product
          </Button>
        }
      />
      {notice ? <p className="text-sm text-success">{notice}</p> : null}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by name or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <QueryState
            status={query.status}
            data={query.data}
            error={query.error}
            onRetry={query.reload}
            loadingLabel="Loading products"
          >
            {([, categories]) => (
              <Select
                label="Category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
            )}
          </QueryState>
        </div>
        <QueryState
          status={query.status}
          data={query.data}
          error={query.error}
          onRetry={query.reload}
          loadingLabel="Loading products"
        >
          {([products]) =>
            products.length === 0 ? (
              <EmptyState
                title="No products in the catalog"
                description="Products you add will be listed here with their SKU, category, and unit."
              />
            ) : (
              <DataTable
                columns={columns("SKU", "Product", "Category", "Unit", "Status")}
                rows={products.map((product) => ({
                  id: product.id,
                  cells: [
                    <Link key="sku" href={`/products/${product.id}`} className="font-medium text-accent hover:underline">
                      {product.sku}
                    </Link>,
                    product.name,
                    product.categoryName,
                    product.unitOfMeasureCode,
                    <StatusBadge
                      key="status"
                      label={product.isActive ? "Active" : "Inactive"}
                      tone={product.isActive ? "success" : "neutral"}
                    />,
                  ],
                }))}
                emptyTitle="No products"
                emptyDescription="No products match this view."
              />
            )
          }
        </QueryState>
      </Card>
      {query.status === "ready" && query.data ? (
        <ProductModal
          open={open}
          categories={query.data[1]}
          units={unitsFrom(query.data[2])}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setNotice("Product created.");
            setOpen(false);
            query.reload();
          }}
        />
      ) : null}
    </div>
  );
}

function ProductModal({
  open,
  categories,
  units,
  onClose,
  onCreated,
}: {
  open: boolean;
  categories: Category[];
  units: Array<{ id: string; code: string }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Modal open={open} title="Add product" description="Catalog identity only. Quantity is tracked in stock." onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          if (!unitId) {
            setError("A unit of measure is required. Add one through an existing product first.");
            return;
          }
          setPending(true);
          void (async () => {
            const resolvedCategoryId = newCategory.trim()
              ? (await createCategory({ name: newCategory.trim() })).id
              : categoryId;
            if (!resolvedCategoryId) {
              throw new Error("Choose a category.");
            }
            await createProduct({
              name: name.trim(),
              sku: sku.trim(),
              categoryId: resolvedCategoryId,
              unitOfMeasureId: unitId,
              isActive,
            });
          })()
            .then(onCreated)
            .catch((err: unknown) => {
              setError(userFacingMessage(err));
              setPending(false);
            });
        }}
      >
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="SKU" value={sku} onChange={(event) => setSku(event.target.value)} required />
        <Select
          label="Category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          options={
            categories.length > 0
              ? categories.map((category) => ({ value: category.id, label: category.name }))
              : [{ value: "", label: "No categories yet" }]
          }
        />
        <Input
          label="New category"
          hint="Optional. Creates a category when this product is saved."
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
        />
        <Select
          label="Unit of measure"
          value={unitId}
          onChange={(event) => setUnitId(event.target.value)}
          options={
            units.length > 0
              ? units.map((unit) => ({ value: unit.id, label: unit.code }))
              : [{ value: "", label: "No units available" }]
          }
        />
        <Select
          label="Status"
          value={isActive ? "active" : "inactive"}
          onChange={(event) => setIsActive(event.target.value === "active")}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function unitsFrom(products: Product[]) {
  const units = new Map<string, string>();
  for (const product of products) {
    units.set(product.unitOfMeasureId, product.unitOfMeasureCode);
  }
  return [...units.entries()].map(([id, code]) => ({ id, code }));
}
