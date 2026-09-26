"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { accountNav, isNavActive, navSections } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-[#0f172a]/40 md:hidden"
          onClick={onNavigate}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-accent text-xs font-semibold text-white">
            SS
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">StockSense</p>
            <p className="mt-1 text-[11px] text-sidebar-muted">Inventory</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Primary">
          {navSections.map((section) => (
            <div key={section.id}>
              <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-sidebar-muted">
                {section.label}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {section.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                          active
                            ? "bg-sidebar-active text-white"
                            : "text-sidebar-foreground/90 hover:bg-white/5",
                        )}
                      >
                        <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="rounded-md px-2 py-2">
            <p className="text-sm font-medium">Signed out</p>
            <p className="text-xs text-sidebar-muted">Account access is not connected</p>
          </div>
          <ul className="mt-1 space-y-0.5">
            {accountNav.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                      active ? "bg-sidebar-active text-white" : "hover:bg-white/5",
                    )}
                  >
                    <Icon name={item.icon} className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/login"
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <Icon name="logout" className="h-4 w-4" />
                Log out
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
