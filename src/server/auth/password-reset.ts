import { normalizeEmail } from "@/server/auth/users";
import { getPrisma } from "@/server/db/prisma";

/**
 * Password reset is accepted as a request only.
 * Delivery is intentionally not performed until a later phase chooses how to send it.
 */
export async function requestPasswordReset(email: string) {
  await getPrisma().user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });

  return { delivered: false as const };
}
