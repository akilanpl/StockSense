"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { firstFieldErrors, signupSchema } from "@/validations/auth";

export function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

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
        setNotice("The form is valid. Account creation is not connected yet.");
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
      {notice ? <p className="text-xs leading-5 text-muted">{notice}</p> : null}
      <Button type="submit" className="w-full">
        Create account
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
