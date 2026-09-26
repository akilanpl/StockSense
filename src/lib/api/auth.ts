import { browserRequest } from "@/lib/api/browser";
import { sessionUserSchema } from "@/types/api";
import { z } from "zod";

const verificationRequiredSchema = z.object({
  verificationRequired: z.literal(true),
});

const acceptedSchema = z.object({
  accepted: z.literal(true),
});

const resetSchema = z.object({
  reset: z.literal(true),
});

export function signup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return browserRequest("/api/auth/signup", verificationRequiredSchema, { method: "POST", body: input });
}

export function verifyEmail(input: { email: string; otp: string }) {
  return browserRequest("/api/auth/verify-email", sessionUserSchema, { method: "POST", body: input });
}

export function resendVerification(email: string) {
  return browserRequest("/api/auth/resend-verification", acceptedSchema, { method: "POST", body: { email } });
}

export function resetPassword(input: { email: string; otp: string; password: string; confirmPassword: string }) {
  return browserRequest("/api/auth/reset-password", resetSchema, { method: "POST", body: input });
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
  return browserRequest("/api/auth/forgot-password", acceptedSchema, {
    method: "POST",
    body: { email },
  });
}
