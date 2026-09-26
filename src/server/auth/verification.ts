import { ApiError } from "@/server/api/errors";
import { sendVerificationEmail } from "@/server/email/mailer";
import { consumeVerificationCode, issueVerificationCode } from "@/server/auth/otp";
import { hashPassword } from "@/server/auth/password";
import type { AuthUser } from "@/server/auth/types";
import { normalizeEmail } from "@/server/auth/users";
import { getPrisma } from "@/server/db/prisma";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerifiedAt: true,
} as const;

export async function startEmailVerification(userId: string, email: string) {
  try {
    const code = await issueVerificationCode(userId, "EMAIL_VERIFY");
    await sendVerificationEmail({ to: email, code, purpose: "EMAIL_VERIFY" });
  } catch (error) {
    await getPrisma().user.delete({ where: { id: userId } }).catch(() => undefined);
    throw error;
  }
}

export async function resendEmailVerification(email: string) {
  const user = await getPrisma().user.findUnique({
    where: { email: normalizeEmail(email) },
    select: userSelect,
  });

  if (!user || user.emailVerifiedAt) {
    return { accepted: true as const };
  }

  const code = await issueVerificationCode(user.id, "EMAIL_VERIFY");
  await sendVerificationEmail({ to: user.email, code, purpose: "EMAIL_VERIFY" });
  return { accepted: true as const };
}

export async function verifyEmail(email: string, otp: string) {
  const user = await requireUserByEmail(email);

  if (user.emailVerifiedAt) {
    throw new ApiError(409, "ALREADY_VERIFIED", "This email is already verified. Sign in to continue.");
  }

  await consumeVerificationCode(user.id, otp, "EMAIL_VERIFY");

  const verified = await getPrisma().user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, name: true, email: true, role: true },
  });

  return verified satisfies AuthUser;
}

export async function requestPasswordReset(email: string) {
  const user = await getPrisma().user.findUnique({
    where: { email: normalizeEmail(email) },
    select: userSelect,
  });

  if (!user?.emailVerifiedAt) {
    return { accepted: true as const };
  }

  const code = await issueVerificationCode(user.id, "PASSWORD_RESET");
  await sendVerificationEmail({ to: user.email, code, purpose: "PASSWORD_RESET" });
  return { accepted: true as const };
}

export async function resetPassword(input: { email: string; otp: string; password: string }) {
  const user = await requireUserByEmail(input.email);

  if (!user.emailVerifiedAt) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify your email before resetting the password.");
  }

  await consumeVerificationCode(user.id, input.otp, "PASSWORD_RESET");

  await getPrisma().user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(input.password) },
  });

  return { reset: true as const };
}

async function requireUserByEmail(email: string) {
  const user = await getPrisma().user.findUnique({
    where: { email: normalizeEmail(email) },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError(400, "OTP_INVALID", "That code is incorrect or no longer active.");
  }

  return user;
}
