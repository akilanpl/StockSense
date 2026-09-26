import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export type DataColumn = {
  id: string;
  header: string;
  className?: string;
};

export type DataRow = {
  id: string;
  cells: ReactNode[];
};

type DataTableProps = {
  columns: DataColumn[];
  rows?: DataRow[];
  emptyTitle: string;
  emptyDescription: string;
};

export function DataTable({ columns, rows = [], emptyTitle, emptyDescription }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background/70">
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="px-3 py-2 text-xs font-medium text-muted"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${columns[index]?.id ?? index}`} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
