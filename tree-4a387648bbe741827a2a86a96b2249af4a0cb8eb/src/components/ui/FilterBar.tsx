import { Select } from "@/components/ui/Select";
import type { FilterDefinition } from "@/types";

export function FilterBar({ filters }: { filters: FilterDefinition[] }) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => (
        <Select
          key={filter.id}
          name={filter.id}
          label={filter.label}
          options={filter.options}
          defaultValue={filter.options[0]?.value}
        />
      ))}
    </div>
  );
}
