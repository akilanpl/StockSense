"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function RootError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ErrorState onRetry={retry} />
    </div>
  );
}
