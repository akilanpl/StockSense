import { browserRequest } from "@/lib/api/browser";
import { sessionUserSchema } from "@/types/api";
import { z } from "zod";

export function signup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return browserRequest("/api/auth/signup", sessionUserSchema, { method: "POST", body: input });
}

export function login(input: { email: string; password: string }) {
  return browserRequest("/api/auth/login", sessionUserSchema, { method: "POST", body: input });
}

export function logout() {
  return browserRequest("/api/auth/logout", z.object({ signedOut: z.literal(true) }), { method: "POST" });
}

export function getSession() {
  return browserRequest("/api/auth", sessionUserSchema);
}

export function requestPasswordReset(email: string) {
  return browserRequest("/api/auth/forgot-password", z.object({ delivered: z.literal(false) }), {
    method: "POST",
    body: { email },
  });
}
