import { Card } from "@/components/ui/Card";

export function KpiCard({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{hint}</p>
    </Card>
  );
}
