import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DetailField } from "@/types";

type DetailSection = {
  title: string;
  fields: DetailField[];
};

type DetailPageProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  sections: DetailSection[];
};

export function DetailPage({
  backHref,
  backLabel,
  title,
  description,
  sections,
}: DetailPageProps) {
  return (
    <div className="space-y-4">
      <Link href={backHref} className="text-sm text-accent hover:underline">
        Back to {backLabel}
      </Link>
      <PageHeader title={title} description={description} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {sections.map((section) => (
          <Card key={section.title} className="p-4">
            <h2 className="text-sm font-semibold">{section.title}</h2>
            <dl className="mt-3 divide-y divide-border">
              {section.fields.map((field) => (
                <div key={field.label} className="grid gap-1 py-2.5 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-xs font-medium text-muted">{field.label}</dt>
                  <dd>
                    <p className="text-sm text-foreground">—</p>
                    <p className="text-xs text-muted">{field.hint}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
        <Card className="lg:col-span-2">
          <EmptyState
            title="No lines loaded"
            description="Operation lines, quantities, and locations will appear in this detail view when the module is connected."
          />
        </Card>
      </div>
    </div>
  );
}
