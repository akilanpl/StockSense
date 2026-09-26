import { cookies } from "next/headers";
import { ApiError } from "@/server/api/errors";
import { readSessionToken, readSessionUserId, SESSION_COOKIE } from "@/server/auth/session";
import type { AuthUser } from "@/server/auth/types";
import { findUserById } from "@/server/auth/users";

export async function getCurrentUser(request?: Request): Promise<AuthUser | null> {
  const token = request ? readSessionToken(request) : (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = readSessionUserId(token);

  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);

  if (!user?.emailVerifiedAt) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new ApiError(401, "UNAUTHENTICATED", "You need to sign in before continuing.");
  }

  return user;
}

export function requireRole(user: AuthUser, allowed: Array<AuthUser["role"]>) {
  if (!allowed.includes(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to do that.");
  }

  return user;
}
