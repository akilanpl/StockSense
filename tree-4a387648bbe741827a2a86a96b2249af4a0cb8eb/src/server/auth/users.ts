import { ApiError } from "@/server/api/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import type { AuthUser } from "@/server/auth/types";
import { getPrisma } from "@/server/db/prisma";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function registerUser(input: { name: string; email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const existing = await getPrisma().user.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    throw new ApiError(409, "DUPLICATE_EMAIL", "A user with this email already exists.");
  }

  const user = await getPrisma().user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
      role: "INVENTORY_MANAGER",
    },
    select: userSelect,
  });

  return user satisfies AuthUser;
}

export async function authenticate(email: string, password: string) {
  const user = await getPrisma().user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  const passwordMatches = user ? verifyPassword(password, user.passwordHash) : verifyPassword(password, dummyHash());

  if (!user || !passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  return toAuthUser(user);
}

export async function findUserById(id: string) {
  const user = await getPrisma().user.findUnique({
    where: { id },
    select: userSelect,
  });

  return user satisfies AuthUser | null;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
  passwordHash?: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  } satisfies AuthUser;
}

let cachedDummyHash: string | null = null;

function dummyHash() {
  cachedDummyHash ??= hashPassword("stocksense-dummy-password");
  return cachedDummyHash;
}
