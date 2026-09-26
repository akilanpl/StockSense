import { StatusBadge } from "@/components/ui/StatusBadge";
import type { StatusLegendItem } from "@/types";

export function StatusLegend({ items }: { items: StatusLegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <span className="text-xs font-medium text-muted">Statuses</span>
      {items.map((item) => (
        <StatusBadge key={item.label} label={item.label} tone={item.tone} />
      ))}
    </div>
  );
}
