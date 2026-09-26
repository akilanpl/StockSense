"use client";

import type { ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { userFacingMessage } from "@/lib/api/errors";

type QueryStateProps<T> = {
  status: "loading" | "error" | "ready";
  error?: unknown;
  onRetry?: () => void;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
  data?: T;
};

export function QueryState<T>({
  status,
  data,
  error,
  onRetry,
  loadingLabel,
  children,
}: QueryStateProps<T>) {
  if (status === "loading") {
    return <LoadingState label={loadingLabel} />;
  }

  if (status === "error" || data === undefined) {
    return <ErrorState description={userFacingMessage(error)} onRetry={onRetry} />;
  }

  return children(data);
}
