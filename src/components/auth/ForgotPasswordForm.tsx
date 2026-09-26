"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/api/auth";
import { userFacingMessage } from "@/lib/api/errors";
import { firstFieldErrors, forgotPasswordSchema } from "@/validations/auth";

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = forgotPasswordSchema.safeParse({ email: form.get("email") });

        if (!parsed.success) {
          setErrors(firstFieldErrors(parsed.error));
          setNotice("");
          return;
        }

        setErrors({});
        setNotice("");
        setPending(true);

        void requestPasswordReset(parsed.data.email)
          .then((result) => {
            if (!result.delivered) {
              setNotice("No email was sent. Password reset delivery is not configured yet.");
            }
            setPending(false);
          })
          .catch((error: unknown) => {
            setNotice(userFacingMessage(error));
            setPending(false);
          });
      }}
    >
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        error={errors.email}
      />
      {notice ? <p className="text-xs leading-5 text-muted">{notice}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Checking reset" : "Request password reset"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
