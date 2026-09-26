import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

const sections = [
  {
    title: "Warehouses",
    description: "Create and review warehouses used by receipts, deliveries, and transfers.",
    href: "/warehouses",
  },
  {
    title: "Locations",
    description: "Create and edit stock locations, including type, parent, and active status.",
    href: "/locations",
  },
  {
    title: "Products",
    description: "Maintain product name, SKU, category, unit, and active status.",
    href: "/products",
  },
  {
    title: "Profile",
    description: "Review the signed-in name, email, and role.",
    href: "/profile",
  },
];

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Workspace setup lives on the master-data and account pages."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">{section.title}</h2>
            </div>
            <div className="space-y-3 px-4 py-4">
              <p className="text-sm text-muted">{section.description}</p>
              <Link href={section.href} className="text-sm font-medium text-accent hover:underline">
                Open {section.title}
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
