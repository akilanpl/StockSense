import { EmptyState } from "@/components/ui/EmptyState";

export type DataColumn = {
  id: string;
  header: string;
  className?: string;
};

type DataTableProps = {
  columns: DataColumn[];
  emptyTitle: string;
  emptyDescription: string;
};

export function DataTable({ columns, emptyTitle, emptyDescription }: DataTableProps) {
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
          <tr>
            <td colSpan={columns.length}>
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
