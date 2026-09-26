import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusLegend } from "@/components/modules/StatusLegend";
import type { FilterDefinition, StatusLegendItem } from "@/types";

type ListPageProps = {
  title: string;
  description: string;
  searchPlaceholder: string;
  columns: DataColumn[];
  emptyTitle: string;
  emptyDescription: string;
  filters?: FilterDefinition[];
  statuses?: StatusLegendItem[];
  actions?: React.ReactNode;
  context?: string;
};

export function ListPage({
  title,
  description,
  searchPlaceholder,
  columns,
  emptyTitle,
  emptyDescription,
  filters = [],
  statuses,
  actions,
  context,
}: ListPageProps) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} actions={actions} />
      {context ? <p className="text-sm text-muted">{context}</p> : null}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 lg:flex-row lg:items-end lg:justify-between">
          <SearchBar placeholder={searchPlaceholder} />
          <FilterBar filters={filters} />
        </div>
        {statuses ? <StatusLegend items={statuses} /> : null}
        <DataTable
          columns={columns}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </Card>
    </div>
  );
}
