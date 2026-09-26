import "dotenv/config";
import { NextResponse } from "next/server";
import { PrismaClient } from "../src/generated/prisma/client";
import { POST as signup } from "../src/app/api/auth/signup/route";
import { POST as login } from "../src/app/api/auth/login/route";
import { POST as logout } from "../src/app/api/auth/logout/route";
import { GET as currentUserRoute } from "../src/app/api/auth/route";
import { POST as forgotPassword } from "../src/app/api/auth/forgot-password/route";
import { POST as verifyEmailRoute } from "../src/app/api/auth/verify-email/route";
import { POST as resendVerification } from "../src/app/api/auth/resend-verification/route";
import { POST as resetPasswordRoute } from "../src/app/api/auth/reset-password/route";
import { POST as createOperationRoute } from "../src/app/api/operations/route";
import { ApiError } from "../src/server/api/errors";
import { getCurrentUser, requireRole } from "../src/server/auth";
import { SESSION_COOKIE } from "../src/server/auth/session";

const prisma = new PrismaClient();

const capturedCodes: string[] = [];
const originalInfo = console.info;
console.info = (...args: unknown[]) => {
  const line = args.map((item) => String(item)).join(" ");
  const match = line.match(/\[DEV EMAIL VERIFICATION\].*code=(\d{6})/);
  if (match?.[1]) {
    capturedCodes.push(match[1]);
  }
  originalInfo(...args);
};

async function main() {
  const stamp = Date.now().toString(36);
  const email = `auth.${stamp}@stocksense.local`;
  const password = "verify-password-1";
  const createdUserIds: string[] = [];
  let operationId: string | null = null;
  let locationId: string | null = null;
  let warehouseId: string | null = null;

  try {
    const signupResponse = await signup(jsonRequest("/api/auth/signup", { name: "Auth Verify", email, password, confirmPassword: password }), unusedContext);
    const signupBody = await readJson(signupResponse);
    assert(signupResponse.status === 201, `signup status ${signupResponse.status}`);
    assert(signupBody.ok === true && signupBody.data.verificationRequired === true, "signup did not require verification");
    assertNoSecret(signupBody, password);
    const signupOtp = takeCode();
    assertNoSecret(signupBody, signupOtp);
    assert(!asNext(signupResponse).cookies.get(SESSION_COOKIE)?.value, "signup created a session before verification");

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    const userId = stored.id;
    createdUserIds.push(userId);
    assert(stored.emailVerifiedAt === null, "signup marked the email verified");
    assert(stored.passwordHash !== password, "password was stored in plaintext");
    assert(stored.passwordHash.startsWith("scrypt$"), "password was not hashed");
    const challenge = await prisma.emailVerificationCode.findFirstOrThrow({ where: { userId } });
    assert(challenge.codeHash !== signupOtp && challenge.codeHash.startsWith("scrypt$"), "OTP was stored in plaintext");

    const duplicate = await signup(jsonRequest("/api/auth/signup", { name: "Auth Verify", email, password, confirmPassword: password }), unusedContext);
    const duplicateBody = await readJson(duplicate);
    assert(duplicate.status === 409 && duplicateBody.ok === false, "duplicate email was not rejected");
    assert(duplicateBody.error.code === "DUPLICATE_EMAIL", "duplicate email code was wrong");

    const unverifiedLogin = await login(jsonRequest("/api/auth/login", { email, password }), unusedContext);
    const unverifiedBody = await readJson(unverifiedLogin);
    assert(unverifiedLogin.status === 403 && unverifiedBody.error.code === "EMAIL_NOT_VERIFIED", "unverified login was allowed");
    assert(!asNext(unverifiedLogin).cookies.get(SESSION_COOKIE)?.value, "unverified login set a session");

    const badOtp = await verifyEmailRoute(jsonRequest("/api/auth/verify-email", { email, otp: signupOtp === "000000" ? "111111" : "000000" }), unusedContext);
    const badOtpBody = await readJson(badOtp);
    assert(badOtp.status === 400 && badOtpBody.error.code === "OTP_INVALID", "wrong OTP was accepted");

    const resent = await resendVerification(jsonRequest("/api/auth/resend-verification", { email }), unusedContext);
    const resentBody = await readJson(resent);
    assert(resent.status === 429 && resentBody.error.code === "OTP_RATE_LIMITED", "resend was not rate limited");
    assertNoSecret(resentBody, signupOtp);

    const verified = await verifyEmailRoute(jsonRequest("/api/auth/verify-email", { email, otp: signupOtp }), unusedContext);
    const verifiedBody = await readJson(verified);
    assert(verified.status === 200 && verifiedBody.data.email === email && verifiedBody.data.role === "INVENTORY_MANAGER", "verification did not return the user");
    assertNoSecret(verifiedBody, password);
    assertNoSecret(verifiedBody, signupOtp);
    const session = asNext(verified).cookies.get(SESSION_COOKIE)?.value;
    assert(Boolean(session), "verification did not set a session cookie");
    const setCookie = verified.headers.get("set-cookie") ?? "";
    assert(/httponly/i.test(setCookie), "session cookie is not HTTP-only");
    const verifiedUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert(verifiedUser.emailVerifiedAt instanceof Date, "email was not marked verified");

    const reused = await verifyEmailRoute(jsonRequest("/api/auth/verify-email", { email, otp: signupOtp }), unusedContext);
    const reusedBody = await readJson(reused);
    assert(reused.status === 409 && reusedBody.error.code === "ALREADY_VERIFIED", "used OTP was accepted again");

    const current = await getCurrentUser(requestWithSession(session!));
    assert(current?.id === userId && current.email === email && current.role === "INVENTORY_MANAGER", "current user lookup failed");
    assert(!("passwordHash" in (current ?? {})), "current user included passwordHash");

    const currentResponse = await currentUserRoute(requestWithSession(session!), {});
    const currentBody = await readJson(currentResponse);
    assert(currentResponse.status === 200 && currentBody.data.id === userId, "session route did not return the user");
    assertNoSecret(currentBody, password);

    const badLogin = await login(jsonRequest("/api/auth/login", { email, password: "wrong-password" }), unusedContext);
    const badBody = await readJson(badLogin);
    assert(badLogin.status === 401 && badBody.error.code === "INVALID_CREDENTIALS", "invalid password was accepted");
    assertNoSecret(badBody, password);

    const goodLogin = await login(jsonRequest("/api/auth/login", { email: email.toUpperCase(), password }), unusedContext);
    const goodBody = await readJson(goodLogin);
    assert(goodLogin.status === 200 && goodBody.data.id === userId, "login did not succeed");
    assertNoSecret(goodBody, password);
    const loginSession = asNext(goodLogin).cookies.get(SESSION_COOKIE)?.value;
    assert(Boolean(loginSession), "login did not set a session cookie");

    const loggedOut = await logout(new Request("http://localhost/api/auth/logout", { method: "POST" }), unusedContext);
    const logoutBody = await readJson(loggedOut);
    assert(loggedOut.status === 200 && logoutBody.data.signedOut === true, "logout did not succeed");
    const cleared = loggedOut.headers.get("set-cookie") ?? "";
    assert(cleared.includes(SESSION_COOKIE) && /max-age=0/i.test(cleared), "logout did not clear the session cookie");
    assert((await getCurrentUser(new Request("http://localhost/api/auth"))) === null, "cleared request still resolved a user");

    const unauthenticated = await createOperationRoute(jsonRequest("/api/operations", { type: "RECEIPT" }), unusedContext);
    assert(unauthenticated.status === 401, "unauthenticated operation create was allowed");

    const warehouse = await prisma.warehouse.create({
      data: { name: `Auth Warehouse ${stamp}`, code: `AUTH-${stamp}`.slice(0, 32) },
    });
    warehouseId = warehouse.id;
    const location = await prisma.location.create({
      data: { warehouseId, name: "Auth Stock", code: `AUTH-LOC-${stamp}`.slice(0, 32), type: "INTERNAL" },
    });
    locationId = location.id;

    const other = await prisma.user.create({
      data: {
        name: "Other User",
        email: `auth.other.${stamp}@stocksense.local`,
        passwordHash: "not-a-login-hash",
        role: "WAREHOUSE_STAFF",
      },
    });
    createdUserIds.push(other.id);

    const created = await createOperationRoute(
      jsonRequest(
        "/api/operations",
        {
          type: "RECEIPT",
          destinationLocationId: location.id,
          createdById: other.id,
        },
        loginSession!,
      ),
      unusedContext,
    );
    const createdBody = await readJson(created);
    assert(created.status === 201, `authenticated create failed: ${created.status} ${JSON.stringify(createdBody)}`);
    assert(createdBody.data.createdById === userId, "operation trusted the client-supplied user id");
    operationId = createdBody.data.id as string;

    let forbidden = false;
    try {
      requireRole(
        { id: userId, name: "Auth Verify", email, role: "INVENTORY_MANAGER" },
        ["WAREHOUSE_STAFF"],
      );
    } catch (error) {
      forbidden = error instanceof ApiError && error.status === 403;
    }
    assert(forbidden, "role helper did not reject a disallowed role");

    const unknownReset = await forgotPassword(jsonRequest("/api/auth/forgot-password", { email: `missing.${stamp}@stocksense.local` }), unusedContext);
    const unknownResetBody = await readJson(unknownReset);
    assert(unknownReset.status === 200 && unknownResetBody.data.accepted === true, "unknown reset leaked account state");

    const reset = await forgotPassword(jsonRequest("/api/auth/forgot-password", { email }), unusedContext);
    const resetBody = await readJson(reset);
    assert(reset.status === 200 && resetBody.data.accepted === true, "password reset was not accepted");
    const resetOtp = takeCode();
    assertNoSecret(resetBody, resetOtp);
    const nextPassword = "verify-password-2";
    const changed = await resetPasswordRoute(
      jsonRequest("/api/auth/reset-password", { email, otp: resetOtp, password: nextPassword, confirmPassword: nextPassword }),
      unusedContext,
    );
    const changedBody = await readJson(changed);
    assert(changed.status === 200 && changedBody.data.reset === true, "password reset did not complete");
    assertNoSecret(changedBody, resetOtp);
    assert(!asNext(changed).cookies.get(SESSION_COOKIE)?.value, "password reset created a session");
    const oldLogin = await login(jsonRequest("/api/auth/login", { email, password }), unusedContext);
    assert(oldLogin.status === 401, "old password still worked");
    const newLogin = await login(jsonRequest("/api/auth/login", { email, password: nextPassword }), unusedContext);
    assert(newLogin.status === 200, "new password did not work");

    const expiredEmail = `auth.expired.${stamp}@stocksense.local`;
    await signup(jsonRequest("/api/auth/signup", { name: "Expired", email: expiredEmail, password, confirmPassword: password }), unusedContext);
    const expiredOtp = takeCode();
    const expiredUser = await prisma.user.findUniqueOrThrow({ where: { email: expiredEmail } });
    createdUserIds.push(expiredUser.id);
    await prisma.emailVerificationCode.updateMany({
      where: { userId: expiredUser.id, usedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await verifyEmailRoute(jsonRequest("/api/auth/verify-email", { email: expiredEmail, otp: expiredOtp }), unusedContext);
    const expiredBody = await readJson(expired);
    assert(expired.status === 400 && expiredBody.error.code === "OTP_EXPIRED", "expired OTP was accepted");

    console.log("Verified signup, email OTP, login, logout, current user, and protected operation creation.");
  } finally {
    if (operationId) {
      await prisma.stockOperation.delete({ where: { id: operationId } });
    }
    if (locationId) {
      await prisma.location.delete({ where: { id: locationId } });
    }
    if (warehouseId) {
      await prisma.warehouse.delete({ where: { id: warehouseId } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    console.info = originalInfo;
    await prisma.$disconnect();
  }
}

const unusedContext = {} as never;

function asNext(response: Response) {
  return response as NextResponse;
}

function jsonRequest(path: string, body: unknown, session?: string) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(session ? { cookie: `${SESSION_COOKIE}=${session}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function requestWithSession(session: string) {
  return new Request("http://localhost/api/auth", {
    headers: { cookie: `${SESSION_COOKIE}=${session}` },
  });
}

async function readJson(response: Response) {
  return (await response.json()) as {
    ok: boolean;
    data: Record<string, unknown>;
    error: { code: string; message: string };
  };
}

function takeCode() {
  const code = capturedCodes.shift();
  assert(code, "verification code was not logged for local delivery");
  return code;
}

function assertNoSecret(body: unknown, password: string) {
  const serialized = JSON.stringify(body);
  assert(!serialized.includes("passwordHash"), "response included passwordHash");
  assert(!serialized.includes(password), "response included the password");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
