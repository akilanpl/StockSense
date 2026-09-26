"use client";

import { useCallback, useState } from "react";
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
import { createLocation, getLocations, getWarehouses, updateLocation } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/api/use-api-query";
import { columns } from "@/lib/columns";
import type { Location, LocationType } from "@/types/api";

export function LocationsList() {
  const [warehouseId, setWarehouseId] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(
    () => Promise.all([getLocations(warehouseId ? { warehouseId } : {}), getWarehouses()]),
    [warehouseId],
  );
  const query = useApiQuery(load, warehouseId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Locations"
        description="Stock locations inside warehouses."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Add Location
          </Button>
        }
      />
      {notice ? <p className="text-sm text-success">{notice}</p> : null}
      <Card>
        <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-3">
          <Input label="Search" placeholder="Name or code" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            label="Type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            options={[
              { value: "", label: "All types" },
              { value: "INTERNAL", label: "Internal" },
              { value: "VIEW", label: "View" },
              { value: "VIRTUAL", label: "Virtual" },
            ]}
          />
          <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading locations">
            {([, warehouses]) => (
              <Select
                label="Warehouse"
                value={warehouseId}
                onChange={(event) => setWarehouseId(event.target.value)}
                options={[{ value: "", label: "All warehouses" }, ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))]}
              />
            )}
          </QueryState>
        </div>
        <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading locations">
          {([locations, warehouses]) => {
            const names = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]));
            const parents = new Map(locations.map((location) => [location.id, location.code]));
            const q = search.trim().toLowerCase();
            const rows = locations.filter((location) => {
              if (type && location.type !== type) return false;
              return !q || location.name.toLowerCase().includes(q) || location.code.toLowerCase().includes(q);
            });
            if (rows.length === 0) {
              return <EmptyState title="No locations" description="Locations will be listed with their warehouse, type, and parent." />;
            }
            return (
              <DataTable
                columns={columns("Name", "Code", "Warehouse", "Type", "Parent", "Status", "")}
                rows={rows.map((location) => ({
                  id: location.id,
                  cells: [
                    location.name,
                    location.code,
                    names.get(location.warehouseId) ?? "—",
                    location.type,
                    location.parentId ? (parents.get(location.parentId) ?? "—") : "—",
                    <StatusBadge key={location.id} label={location.isActive ? "Active" : "Inactive"} tone={location.isActive ? "success" : "neutral"} />,
                    <Button key={`${location.id}-edit`} size="sm" variant="secondary" onClick={() => setEditing(location)}>
                      Edit
                    </Button>,
                  ],
                }))}
                emptyTitle="No locations"
                emptyDescription="No locations match this view."
              />
            );
          }}
        </QueryState>
      </Card>
      {query.status === "ready" && query.data ? (
        <LocationModal
          open={open || editing !== null}
          location={editing}
          warehouses={query.data[1]}
          locations={query.data[0]}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSaved={(message) => {
            setNotice(message);
            setOpen(false);
            setEditing(null);
            query.reload();
          }}
        />
      ) : null}
    </div>
  );
}

function LocationModal({
  open,
  location,
  warehouses,
  locations,
  onClose,
  onSaved,
}: {
  open: boolean;
  location: Location | null;
  warehouses: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; warehouseId: string; name: string; code: string }>;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const formKey = location?.id ?? "new";
  const [loadedKey, setLoadedKey] = useState(formKey);
  const [warehouseId, setWarehouseId] = useState(location?.warehouseId ?? warehouses[0]?.id ?? "");
  const [name, setName] = useState(location?.name ?? "");
  const [code, setCode] = useState(location?.code ?? "");
  const [type, setType] = useState<LocationType>(location?.type ?? "INTERNAL");
  const [parentId, setParentId] = useState(location?.parentId ?? "");
  const [isActive, setIsActive] = useState(location?.isActive ?? true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (loadedKey !== formKey) {
    setLoadedKey(formKey);
    setWarehouseId(location?.warehouseId ?? warehouses[0]?.id ?? "");
    setName(location?.name ?? "");
    setCode(location?.code ?? "");
    setType(location?.type ?? "INTERNAL");
    setParentId(location?.parentId ?? "");
    setIsActive(location?.isActive ?? true);
    setError("");
    setPending(false);
  }
  const parents = locations.filter((item) => item.warehouseId === warehouseId && item.id !== location?.id);

  return (
    <Modal
      open={open}
      title={location ? "Edit location" : "Add location"}
      description="Locations belong to one warehouse. The server rejects a parent that would create a cycle."
      onClose={onClose}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const request = location
            ? updateLocation(location.id, {
                name: name.trim(),
                code: code.trim(),
                type,
                parentId: parentId || null,
                isActive,
              })
            : createLocation({
                warehouseId,
                name: name.trim(),
                code: code.trim(),
                type,
                parentId: parentId || null,
                isActive,
              });
          void request
            .then(() => {
              setPending(false);
              if (!location) {
                setName("");
                setCode("");
              }
              onSaved(location ? "Location updated." : "Location created.");
            })
            .catch((err: unknown) => {
              setError(userFacingMessage(err));
              setPending(false);
            });
        }}
      >
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Select
          label="Warehouse"
          value={warehouseId}
          disabled={Boolean(location)}
          onChange={(event) => {
            setWarehouseId(event.target.value);
            setParentId("");
          }}
          options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
        />
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="Code" value={code} onChange={(event) => setCode(event.target.value)} required />
        <Select
          label="Type"
          value={type}
          onChange={(event) => setType(event.target.value as LocationType)}
          options={[
            { value: "INTERNAL", label: "Internal" },
            { value: "VIEW", label: "View" },
            { value: "VIRTUAL", label: "Virtual" },
          ]}
        />
        <Select
          label="Parent"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          options={[{ value: "", label: "No parent" }, ...parents.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))]}
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button type="submit" disabled={pending || !warehouseId}>{pending ? "Saving" : "Save location"}</Button>
        </div>
      </form>
    </Modal>
  );
}
