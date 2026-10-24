import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">404</p>
        <h1 className="mt-2 text-xl font-semibold">This page is not in StockSense</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          The address does not match a workspace route. Return to the dashboard to
          continue.
        </p>
        <Link href="/dashboard" className={`${buttonClassName({})} mt-5`}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
