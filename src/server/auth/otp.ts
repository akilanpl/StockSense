import { randomInt } from "node:crypto";
import type { VerificationPurpose } from "@/generated/prisma/client";
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
  const prisma = getPrisma();
  const latest = await prisma.emailVerificationCode.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new ApiError(429, "OTP_RATE_LIMITED", "Wait a minute before requesting another code.");
  }

  const code = generateOtp();

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationCode.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.emailVerificationCode.create({
      data: {
        userId,
        purpose,
        codeHash: hashPassword(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
  });

  return code;
}

export async function consumeVerificationCode(userId: string, otp: string, purpose: VerificationPurpose) {
  const prisma = getPrisma();
  const challenge = await prisma.emailVerificationCode.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    verifyPassword(otp, dummyOtpHash());
    throw new ApiError(400, "OTP_INVALID", "That code is incorrect or no longer active.");
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    await prisma.emailVerificationCode.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    });
    throw new ApiError(400, "OTP_EXPIRED", "That code has expired. Request a new one.");
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await prisma.emailVerificationCode.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    });
    throw new ApiError(429, "OTP_LOCKED", "Too many attempts. Request a new code.");
  }

  if (!verifyPassword(otp, challenge.codeHash)) {
    const attempts = challenge.attempts + 1;
    await prisma.emailVerificationCode.update({
      where: { id: challenge.id },
      data: {
        attempts,
        usedAt: attempts >= MAX_ATTEMPTS ? new Date() : null,
      },
    });
    throw new ApiError(
      attempts >= MAX_ATTEMPTS ? 429 : 400,
      attempts >= MAX_ATTEMPTS ? "OTP_LOCKED" : "OTP_INVALID",
      attempts >= MAX_ATTEMPTS ? "Too many attempts. Request a new code." : "That code is incorrect or no longer active.",
    );
  }

  await prisma.emailVerificationCode.update({
    where: { id: challenge.id },
    data: { usedAt: new Date() },
  });
}

let cachedDummyOtpHash: string | null = null;

function dummyOtpHash() {
  cachedDummyOtpHash ??= hashPassword("000000");
  return cachedDummyOtpHash;
}
