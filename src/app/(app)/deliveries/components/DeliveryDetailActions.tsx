"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function DeliveryDetailActions() {
  const [notice, setNotice] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() =>
            setNotice(
              "Validate is not yet connected. This action will process the delivery when the module is wired.",
            )
          }
        >
          Validate delivery
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            setNotice(
              "Cancel is not yet connected. This action will cancel the delivery when the module is wired.",
            )
          }
        >
          Cancel delivery
        </Button>
      </div>
      {notice ? (
        <p className="text-xs leading-5 text-muted">{notice}</p>
      ) : null}
    </div>
  );
}
