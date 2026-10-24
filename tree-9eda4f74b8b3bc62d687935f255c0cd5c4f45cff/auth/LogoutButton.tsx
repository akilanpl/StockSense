"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";

export function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void logout().finally(() => {
          router.push("/login");
          router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}
