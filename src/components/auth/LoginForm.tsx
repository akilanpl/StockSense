"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { firstFieldErrors, loginSchema } from "@/validations/auth";

export function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = loginSchema.safeParse({
          email: form.get("email"),
          password: form.get("password"),
        });

        if (!parsed.success) {
          setErrors(firstFieldErrors(parsed.error));
          setNotice("");
          return;
        }

        setErrors({});
        setNotice(
          "The form is valid. Sign-in is not connected yet, so no session was created.",
        );
      }}
    >
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@company.com"
        error={errors.email}
      />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        error={errors.password}
      />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-accent hover:underline">
          Forgot password
        </Link>
      </div>
      {notice ? <p className="text-xs leading-5 text-muted">{notice}</p> : null}
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      <p className="text-center text-sm text-muted">
        New to StockSense?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <p className="text-center text-xs text-muted">
        <Link href="/dashboard" className="hover:underline">
          Preview the workspace
        </Link>
      </p>
    </form>
  );
}
