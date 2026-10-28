import { randomInt } from "node:crypto";
import type { Prisma, VerificationPurpose } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getPrisma } from "@/server/db/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function issueVerificationCode(userId: string, purpose: VerificationPurpose) {
  return getPrisma().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = CAST(${userId} AS uuid) FOR UPDATE`;
    const latest = await tx.emailVerificationCode.findFirst({
      where: { userId, purpose }, orderBy: { createdAt: "desc" },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "OTP_RATE_LIMITED", "Wait a minute before requesting another code.");
    }
    const code = generateOtp();
    await tx.emailVerificationCode.updateMany({ where: { userId, purpose, usedAt: null }, data: { usedAt: new Date() } });
    await tx.emailVerificationCode.create({ data: {
      userId, purpose, codeHash: hashPassword(code), expiresAt: new Date(Date.now() + OTP_TTL_MS),
    } });
    return code;
  });
}

export async function consumeVerificationCode(
  userId: string, otp: string, purpose: VerificationPurpose,
  onVerified?: (tx: Prisma.TransactionClient) => Promise<void>,
) {
  const error = await getPrisma().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = CAST(${userId} AS uuid) FOR UPDATE`;
    const challenge = await tx.emailVerificationCode.findFirst({
      where: { userId, purpose, usedAt: null }, orderBy: { createdAt: "desc" },
    });
    if (!challenge) {
      verifyPassword(otp, dummyOtpHash());
      return new ApiError(400, "OTP_INVALID", "That code is incorrect or no longer active.");
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
      await tx.emailVerificationCode.update({ where: { id: challenge.id }, data: { usedAt: new Date() } });
      return new ApiError(400, "OTP_EXPIRED", "That code has expired. Request a new one.");
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      await tx.emailVerificationCode.update({ where: { id: challenge.id }, data: { usedAt: new Date() } });
      return new ApiError(429, "OTP_LOCKED", "Too many attempts. Request a new code.");
    }
    if (!verifyPassword(otp, challenge.codeHash)) {
      const attempts = challenge.attempts + 1;
      await tx.emailVerificationCode.update({ where: { id: challenge.id }, data: {
        attempts, usedAt: attempts >= MAX_ATTEMPTS ? new Date() : null,
      } });
      return new ApiError(attempts >= MAX_ATTEMPTS ? 429 : 400,
        attempts >= MAX_ATTEMPTS ? "OTP_LOCKED" : "OTP_INVALID",
        attempts >= MAX_ATTEMPTS ? "Too many attempts. Request a new code." : "That code is incorrect or no longer active.");
    }
    await tx.emailVerificationCode.update({ where: { id: challenge.id }, data: { usedAt: new Date() } });
    if (onVerified) await onVerified(tx);
    return null;
  }, { timeout: 20_000 });
  if (error) throw error;
}

let cachedDummyOtpHash: string | null = null;
function dummyOtpHash() {
  cachedDummyOtpHash ??= hashPassword("000000");
  return cachedDummyOtpHash;
}
