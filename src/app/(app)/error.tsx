"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { userFacingMessage } from "@/lib/api/errors";

export default function WorkspaceError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState description={userFacingMessage(error)} onRetry={retry} />;
}
