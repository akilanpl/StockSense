"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-0 text-foreground shadow-sm backdrop:bg-slate-900/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <h2 id={titleId} className="text-sm font-semibold">{title}</h2>
          {description ? <p id={descriptionId} className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">Close</Button>
      </div>
      <div className="px-4 py-4">{children}</div>
    </dialog>
  );
}
