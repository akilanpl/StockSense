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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createWarehouse, getWarehouses } from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/api/use-api-query";
import { columns } from "@/lib/columns";

export function WarehousesList() {
  const load = useCallback(() => getWarehouses(), []);
  const query = useApiQuery(load, "warehouses");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Warehouses"
        description="Physical sites that own stock locations."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Add Warehouse
          </Button>
        }
      />
      {notice ? <p className="text-sm text-success">{notice}</p> : null}
      <Card>
        <div className="border-b border-border px-4 py-3">
          <Input label="Search" placeholder="Name or code" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading warehouses">
          {(warehouses) => {
            const q = search.trim().toLowerCase();
            const rows = warehouses.filter((warehouse) =>
              !q || warehouse.name.toLowerCase().includes(q) || warehouse.code.toLowerCase().includes(q),
            );
            if (rows.length === 0) {
              return <EmptyState title="No warehouses" description="Warehouses you add will be listed with their code and address." />;
            }
            return (
              <DataTable
                columns={columns("Name", "Code", "Address", "Status")}
                rows={rows.map((warehouse) => ({
                  id: warehouse.id,
                  cells: [
                    warehouse.name,
                    warehouse.code,
                    warehouse.address ?? "—",
                    <StatusBadge key={warehouse.id} label={warehouse.isActive ? "Active" : "Inactive"} tone={warehouse.isActive ? "success" : "neutral"} />,
                  ],
                }))}
                emptyTitle="No warehouses"
                emptyDescription="No warehouses match this search."
              />
            );
          }}
        </QueryState>
      </Card>
      <WarehouseModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setNotice("Warehouse created.");
          setOpen(false);
          query.reload();
        }}
      />
    </div>
  );
}

function WarehouseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Modal open={open} title="Add warehouse" description="Name and code identify the site." onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          void createWarehouse({ name: name.trim(), code: code.trim(), address: address.trim() || null, isActive: true })
            .then(() => {
              setPending(false);
              setName("");
              setCode("");
              setAddress("");
              onCreated();
            })
            .catch((err: unknown) => {
              setError(userFacingMessage(err));
              setPending(false);
            });
        }}
      >
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="Code" value={code} onChange={(event) => setCode(event.target.value)} required />
        <Input label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving" : "Save warehouse"}</Button>
        </div>
      </form>
    </Modal>
  );
}
