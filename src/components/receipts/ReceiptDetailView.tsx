"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { QueryState } from "@/components/ui/QueryState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  cancelOperation,
  getOperation,
  getProducts,
  markOperationReady,
  validateOperation,
} from "@/lib/api";
import { userFacingMessage } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/api/use-api-query";
import { formatLabel, formatTimestamp } from "@/lib/format";
import { ReceiptLineItems } from "./ReceiptLineItems";
import type { ReceiptOperation } from "./types";

const tones = {
  DRAFT: "neutral",
  WAITING: "warning",
  READY: "info",
  DONE: "success",
  CANCELED: "danger",
} as const;

export function ReceiptDetailView({ receiptId }: { receiptId: string }) {
  const load = useCallback(() => Promise.all([getOperation(receiptId), getProducts()]), [receiptId]);
  const query = useApiQuery(load, receiptId);
  const [receipt, setReceipt] = useState<ReceiptOperation | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [pending, setPending] = useState(false);

  const current = receipt ?? (query.status === "ready" ? query.data?.[0] : null);

  return (
    <div className="space-y-4">
      <Link href="/receipts" className="text-sm text-accent hover:underline">
        ← Back to Receipts
      </Link>
      <QueryState status={query.status} data={query.data} error={query.error} onRetry={query.reload} loadingLabel="Loading receipt">
        {([loaded, products]) => {
          const operation = current && current.id === loaded.id ? current : loaded;
          if (operation.type !== "RECEIPT") {
            return <ErrorState title="Not a receipt" description="This operation is not an incoming receipt." />;
          }
          const draft = operation.status === "DRAFT" || operation.status === "WAITING";
          const ready = operation.status === "READY";
          return (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">{operation.reference}</h1>
                  <StatusBadge label={formatLabel(operation.status)} tone={tones[operation.status]} />
                </div>
                <div className="flex gap-2">
                  {draft ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setPending(true);
                        setActionError("");
                        void markOperationReady(operation.id)
                          .then((updated) => {
                            setReceipt(updated);
                            setActionNotice("Receipt is ready to validate.");
                            setPending(false);
                          })
                          .catch((err: unknown) => {
                            setActionError(userFacingMessage(err));
                            setPending(false);
                          });
                      }}
                    >
                      Mark ready
                    </Button>
                  ) : null}
                  {ready ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setPending(true);
                        setActionError("");
                        void validateOperation(operation.id)
                          .then((updated) => {
                            setReceipt(updated);
                            setActionNotice("Receipt validated. Stock was updated by the server.");
                            setPending(false);
                          })
                          .catch((err: unknown) => {
                            setActionError(userFacingMessage(err));
                            setPending(false);
                          });
                      }}
                    >
                      Validate
                    </Button>
                  ) : null}
                  {draft || ready ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm("Cancel this receipt?")) return;
                        setPending(true);
                        void cancelOperation(operation.id)
                          .then((updated) => {
                            setReceipt(updated);
                            setActionNotice("Receipt cancelled.");
                            setPending(false);
                          })
                          .catch((err: unknown) => {
                            setActionError(userFacingMessage(err));
                            setPending(false);
                          });
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
              {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
              {actionNotice ? <p className="text-sm text-success">{actionNotice}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <h2 className="text-sm font-semibold">Operation</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-muted">Supplier</dt><dd>{operation.partnerName ?? "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd>{operation.status}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Created</dt><dd>{formatTimestamp(operation.createdAt)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Validated</dt><dd>{operation.validatedAt ? formatTimestamp(operation.validatedAt) : "—"}</dd></div>
                  </dl>
                </Card>
                <Card className="p-4">
                  <h2 className="text-sm font-semibold">Destination</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-muted">Location</dt><dd>{operation.destinationLocationCode ?? "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-muted">Created by</dt><dd>{operation.createdByName}</dd></div>
                  </dl>
                </Card>
              </div>
              <ReceiptLineItems
                operation={operation}
                products={products}
                isDraft={operation.status === "DRAFT"}
                onOperationUpdated={setReceipt}
              />
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
