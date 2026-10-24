import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError } from "@/server/api/errors";

export const SESSION_COOKIE = "stocksense_session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  exp: number;
};

export function createSessionToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 } satisfies SessionPayload),
  ).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function readSessionUserId(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || token.split(".").length !== 2) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionPayload>;

    if (typeof parsed.sub !== "string" || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }

    return parsed.sub;
  } catch {
    return null;
  }
}

export function readSessionToken(request: Request) {
  const header = request.headers.get("cookie");

  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");

    if (name === SESSION_COOKIE) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

export function withSession(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId), cookieOptions(MAX_AGE_SECONDS));
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
  return response;
}

function sign(payload: string) {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

function authSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new ApiError(500, "AUTH_NOT_CONFIGURED", "Authentication is not configured.");
  }

  return secret;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
