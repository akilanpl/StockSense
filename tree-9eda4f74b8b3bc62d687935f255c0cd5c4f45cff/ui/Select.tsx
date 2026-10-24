import { cn } from "@/lib/cn";
import type { SelectOption } from "@/types";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  error?: string;
};

export function Select({ label, options, error, id, className, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="block min-w-40" htmlFor={selectId}>
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <select
        id={selectId}
        className={cn(
          "h-9 w-full rounded-md border bg-card px-2.5 text-sm text-foreground outline-none",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
