import { useId } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;

  return (
    <label className="block" htmlFor={inputId}>
      <span id={`${inputId}-label`} className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <input
        id={inputId}
        aria-labelledby={`${inputId}-label`}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${inputId}-help` : undefined}
        className={cn(
          "h-9 w-full rounded-md border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
      {error ? <span id={`${inputId}-help`} role="alert" className="mt-1 block text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span id={`${inputId}-help`} className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
