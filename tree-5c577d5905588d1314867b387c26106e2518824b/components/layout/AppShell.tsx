"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { SessionUser } from "@/types/api";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} open={open} onNavigate={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-4 md:px-6 md:py-5">{children}</main>
      </div>
    </div>
  );
}
