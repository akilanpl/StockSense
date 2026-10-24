"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Icon } from "@/components/ui/Icon";
import { titleForPath } from "@/lib/navigation";
import type { SessionUser } from "@/types/api";

export function TopBar({ user, onMenu }: { user: SessionUser | null; onMenu: () => void }) {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-3 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border md:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Icon name="menu" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className="truncate text-xs text-muted">No warehouse selected</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="hidden rounded-md px-2 py-1 text-sm text-muted hover:bg-background sm:inline"
        >
          Profile
        </Link>
        {user ? (
          <LogoutButton className="rounded-md border border-border px-2.5 py-1 text-sm hover:bg-background">
            Log out
          </LogoutButton>
        ) : (
          <Link
            href="/login"
            className="rounded-md border border-border px-2.5 py-1 text-sm hover:bg-background"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
