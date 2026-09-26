import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <input
        id={inputId}
        className={cn(
          "h-9 w-full rounded-md border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
