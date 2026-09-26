import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_28rem]">
      <section className="hidden flex-col justify-between bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex">
        <Link href="/login" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold text-white">
            SS
          </span>
          <span className="text-sm font-semibold">StockSense</span>
        </Link>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">
            Inventory operations in one workspace.
          </h1>
          <p className="mt-4 text-sm leading-6 text-sidebar-muted">
            Track products, receipts, deliveries, transfers, and on-hand stock
            across warehouses and locations.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">Odoo x GCET Hyderabad</p>
      </section>
      <section className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}
