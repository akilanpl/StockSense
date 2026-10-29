import { createHash } from "node:crypto";
import { getPrisma } from "@/server/db/prisma";
import { ApiError } from "@/server/api/errors";

// Database-backed so parallel requests and multiple application instances share a limit.
// Only failed credentials are counted. Counting every request before authentication would
// let an unauthenticated party lock a known email out of a valid sign-in indefinitely.
export async function recordFailedLoginAttempt(email: string) {
  const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const rows = await getPrisma().$queryRaw<Array<{ attempts: number }>>`
    INSERT INTO login_limits (key, attempts, expires_at)
    VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN login_limits.expires_at <= NOW() THEN 1 ELSE LEAST(login_limits.attempts + 1, 21) END,
      expires_at = CASE WHEN login_limits.expires_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE login_limits.expires_at END
    RETURNING attempts
  `;
  if (rows[0].attempts > 20) {
    throw new ApiError(429, "LOGIN_RATE_LIMITED", "Too many sign-in attempts. Wait 15 minutes before trying again.");
  }
}

export async function clearLoginLimit(email: string) {
  const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  await getPrisma().$executeRaw`DELETE FROM login_limits WHERE key = ${key}`;
}
