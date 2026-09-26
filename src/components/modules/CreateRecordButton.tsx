"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { FormField } from "@/types";

type CreateRecordButtonProps = {
  label: string;
  title: string;
  description: string;
  fields: FormField[];
};

export function CreateRecordButton({
  label,
  title,
  description,
  fields,
}: CreateRecordButtonProps) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icon name="plus" className="h-4 w-4" />
        {label}
      </Button>
      <Modal
        open={open}
        title={title}
        description={description}
        onClose={() => {
          setOpen(false);
          setNotice("");
        }}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setNotice("Nothing was saved. This action will be connected in a later phase.");
          }}
        >
          {fields.map((field) => (
            <Input
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
            />
          ))}
          {notice ? <p className="text-xs leading-5 text-muted">{notice}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setNotice("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save draft</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
