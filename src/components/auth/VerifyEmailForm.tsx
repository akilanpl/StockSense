"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resendVerification, verifyEmail } from "@/lib/api/auth";
import { userFacingMessage } from "@/lib/api/errors";
import { firstFieldErrors, verifyEmailSchema } from "@/validations/auth";

export function VerifyEmailForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [tone, setTone] = useState<"danger" | "muted">("danger");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = verifyEmailSchema.safeParse({
          email: form.get("email"),
          otp: String(form.get("otp") ?? "").trim(),
        });

        if (!parsed.success) {
          setErrors(firstFieldErrors(parsed.error));
          setNotice("");
          return;
        }

        setErrors({});
        setNotice("");
        setPending(true);

        void verifyEmail(parsed.data)
          .then(() => {
            setTone("muted");
            setNotice("Email verified. Opening the workspace.");
            router.push("/dashboard");
            router.refresh();
          })
          .catch((error: unknown) => {
            setTone("danger");
            setNotice(userFacingMessage(error));
            setPending(false);
          });
      }}
    >
      <Input name="email" type="email" label="Email" autoComplete="email" defaultValue={initialEmail} error={errors.email} />
      <Input
        name="otp"
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="6-digit code"
        error={errors.otp}
        hint="The code expires in 10 minutes. Do not share it."
      />
      {notice ? <p className={tone === "danger" ? "text-xs leading-5 text-danger" : "text-xs leading-5 text-muted"}>{notice}</p> : null}
      <Button type="submit" className="w-full" disabled={pending || resending}>
        {pending ? "Verifying" : "Verify email"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={pending || resending}
        onClick={(event) => {
          const form = event.currentTarget.form;
          const email = String(new FormData(form ?? undefined).get("email") ?? "");
          const parsed = verifyEmailSchema.pick({ email: true }).safeParse({ email });
          if (!parsed.success) {
            setErrors(firstFieldErrors(parsed.error));
            return;
          }
          setResending(true);
          setNotice("");
          void resendVerification(parsed.data.email)
            .then(() => {
              setTone("muted");
              setNotice("If this email still needs verification, a new code was sent. It expires in 10 minutes.");
              setResending(false);
            })
            .catch((error: unknown) => {
              setTone("danger");
              setNotice(userFacingMessage(error));
              setResending(false);
            });
        }}
      >
        {resending ? "Sending code" : "Resend code"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
