import { ApiError } from "@/server/api/errors";

export function assertSignupAllowed(email: string) {
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_PUBLIC_SIGNUP === "true") return;
  const allowed = (process.env.SIGNUP_ALLOWED_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email.trim().toLowerCase())) {
    throw new ApiError(403, "SIGNUP_RESTRICTED", "Registration is restricted. Ask the workspace owner to approve your email address.");
  }
}
