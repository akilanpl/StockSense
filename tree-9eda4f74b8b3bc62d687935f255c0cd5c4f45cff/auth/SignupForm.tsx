"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signup } from "@/lib/api/auth";
import { userFacingMessage } from "@/lib/api/errors";
import { firstFieldErrors, signupSchema } from "@/validations/auth";

export function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = signupSchema.safeParse({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword"),
        });

        if (!parsed.success) {
          setErrors(firstFieldErrors(parsed.error));
          setNotice("");
          return;
        }

        setErrors({});
        setNotice("");
        setPending(true);

        void signup(parsed.data)
          .then(() => {
            router.push("/dashboard");
            router.refresh();
          })
          .catch((error: unknown) => {
            setNotice(userFacingMessage(error));
            setPending(false);
          });
      }}
    >
      <Input name="name" label="Name" autoComplete="name" error={errors.name} />
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        error={errors.email}
      />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        error={errors.password}
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      {notice ? <p className="text-xs leading-5 text-danger">{notice}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
