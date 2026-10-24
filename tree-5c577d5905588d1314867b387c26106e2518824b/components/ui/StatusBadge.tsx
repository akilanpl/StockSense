import { cn } from "@/lib/cn";
import type { StatusTone } from "@/types";

const tones: Record<StatusTone, string> = {
  neutral: "bg-background text-muted",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}
