"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";
import { userFacingMessage } from "@/lib/api/errors";
import { firstFieldErrors, forgotPasswordSchema, resetPasswordSchema } from "@/validations/auth";

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [tone, setTone] = useState<"danger" | "muted">("muted");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [requested, setRequested] = useState(false);

  if (!requested) {
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
            .then(() => {
              setEmail(parsed.data.email);
              setRequested(true);
              setTone("muted");
              setNotice("If that email belongs to a verified account, a reset code was sent. It expires in 10 minutes.");
              setPending(false);
            })
            .catch((error: unknown) => {
              setTone("danger");
              setNotice(userFacingMessage(error));
              setPending(false);
            });
        }}
      >
        <Input name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
        {notice ? <p className={tone === "danger" ? "text-xs leading-5 text-danger" : "text-xs leading-5 text-muted"}>{notice}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending code" : "Send reset code"}
        </Button>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = resetPasswordSchema.safeParse({
          email,
          otp: String(form.get("otp") ?? "").trim(),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword"),
        });

        if (!parsed.success) {
          setErrors(firstFieldErrors(parsed.error));
          setNotice("");
          return;
        }

        setErrors({});
        setPending(true);

        void resetPassword(parsed.data)
          .then(() => {
            setTone("muted");
            setNotice("Password updated. Sign in with the new password.");
            setPending(false);
          })
          .catch((error: unknown) => {
            setTone("danger");
            setNotice(userFacingMessage(error));
            setPending(false);
          });
      }}
    >
      <Input name="otp" label="Reset code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={errors.otp} hint="The code expires in 10 minutes. Do not share it." />
      <Input name="password" type="password" label="New password" autoComplete="new-password" error={errors.password} />
      <Input name="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" error={errors.confirmPassword} />
      {notice ? <p className={tone === "danger" ? "text-xs leading-5 text-danger" : "text-xs leading-5 text-muted"}>{notice}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating password" : "Update password"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
