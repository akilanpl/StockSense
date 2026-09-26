import type { AuthUser } from "@/server/auth/types";

/**
 * Session lookup for later authentication work.
 * Phase 1 always returns null so the interface can stay stable.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return null;
}
