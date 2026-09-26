import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const sections = [
  {
    title: "Company",
    description: "Legal name, address, and the company this inventory workspace belongs to.",
  },
  {
    title: "Warehouses",
    description: "Default warehouse used when a receipt, delivery, or transfer is created.",
  },
  {
    title: "Units and tracking",
    description: "Default unit of measure and whether new products track lots or serial numbers.",
  },
  {
    title: "Access",
    description: "People who can operate inventory, and the roles they hold.",
  },
];

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Company, warehouse defaults, and access for the inventory workspace. Nothing is stored in this phase."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">{section.title}</h2>
            </div>
            <EmptyState title="Not configured" description={section.description} />
          </Card>
        ))}
      </div>
    </div>
  );
}
