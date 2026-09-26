"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusLegend } from "@/components/modules/StatusLegend";
import { operationStatuses } from "@/lib/statuses";
import { CreateDeliveryModal } from "./CreateDeliveryModal";
import {
  type DeliveryOperation,
  type LocationOption,
  type ProductOption,
  formatDate,
  getStatusBadgeProps,
} from "./types";

export function DeliveriesList() {
  const [deliveries, setDeliveries] = useState<DeliveryOperation[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [defaultUserId, setDefaultUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [opsRes, locsRes, prodsRes] = await Promise.all([
        fetch("/api/operations?type=DELIVERY"),
        fetch("/api/locations"),
        fetch("/api/products"),
      ]);

      const opsJson = await opsRes.json();
      if (!opsRes.ok || !opsJson.ok) {
        throw new Error(opsJson.error?.message || "Failed to load deliveries.");
      }

      const opsData: DeliveryOperation[] = opsJson.data || [];
      setDeliveries(opsData);

      // Extract existing userId if available
      if (opsData.length > 0 && opsData[0]?.createdById) {
        setDefaultUserId(opsData[0].createdById);
      } else {
        const stored = typeof window !== "undefined" ? localStorage.getItem("stocksense_user_id") : null;
        if (stored) setDefaultUserId(stored);
      }

      if (locsRes.ok) {
        const locsJson = await locsRes.json();
        if (locsJson.ok && Array.isArray(locsJson.data)) {
          setLocations(locsJson.data);
        }
      }

      if (prodsRes.ok) {
        const prodsJson = await prodsRes.json();
        if (prodsJson.ok && Array.isArray(prodsJson.data)) {
          setProducts(prodsJson.data);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load delivery operations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Location filter
      if (locationFilter !== "all" && item.sourceLocationId !== locationFilter) {
        return false;
      }

      // Text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = item.reference?.toLowerCase().includes(query);
        const matchesCustomer = item.partnerName?.toLowerCase().includes(query);
        const matchesLocation = item.sourceLocationCode?.toLowerCase().includes(query);
        const matchesItems = item.items?.some(
          (i) => i.productName?.toLowerCase().includes(query) || i.sku?.toLowerCase().includes(query),
        );

        if (!matchesRef && !matchesCustomer && !matchesLocation && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [deliveries, statusFilter, locationFilter, searchQuery]);

  function handleDeliveryCreated(newDelivery: DeliveryOperation) {
    setDeliveries((prev) => [newDelivery, ...prev]);
    if (newDelivery.createdById) {
      setDefaultUserId(newDelivery.createdById);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Deliveries"
        description="Outgoing operations that move stock from a warehouse location to a customer or destination."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Create Delivery
          </Button>
        }
      />

      <Card>
        {/* Controls Bar: Search & Filters */}
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search by reference, customer, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Cancelled</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              aria-label="Filter by source location"
              className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All source locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <StatusLegend items={operationStatuses} />

        {/* Content States */}
        {loading ? (
          <div className="py-12">
            <LoadingState label="Loading deliveries..." />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Error loading deliveries"
              description={error}
              onRetry={fetchData}
            />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <EmptyState
            title="No deliveries found"
            description={
              searchQuery || statusFilter !== "all" || locationFilter !== "all"
                ? "No outgoing operations match your active filters."
                : "Outgoing deliveries will show the customer, source location, schedule, and status."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60">
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Reference
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Deliver to
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Source Location
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted text-center">
                    Lines
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Created Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeliveries.map((op) => {
                  const badgeProps = getStatusBadgeProps(op.status);
                  return (
                    <tr key={op.id} className="hover:bg-background/40 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/deliveries/${op.id}`}
                          className="text-accent hover:underline font-semibold"
                        >
                          {op.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {op.partnerName || "Customer"}
                      </td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">
                        {op.sourceLocationCode || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted font-medium">
                        {op.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDate(op.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={badgeProps.label} tone={badgeProps.tone} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/deliveries/${op.id}`}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateDeliveryModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleDeliveryCreated}
        locations={locations}
        products={products}
        defaultUserId={defaultUserId}
      />
    </div>
  );
}
