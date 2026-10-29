import { clearLoginLimit, recordFailedLoginAttempt } from "@/server/auth/login-limit";
import { ApiError } from "@/server/api/errors";
import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withSession } from "@/server/auth/session";
import { authenticate } from "@/server/auth/users";
import { withPublicApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { loginSchema } from "@/validations/auth";

export const POST = withPublicApi(async (request) => {
  const input = parseInput(loginSchema, await readJsonBody(request));
  let user: Awaited<ReturnType<typeof authenticate>>;
  try {
    user = await authenticate(input.email, input.password);
  } catch (error) {
    if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
      await recordFailedLoginAttempt(input.email);
    }
    throw error;
  }
  await clearLoginLimit(input.email);
  return withSession(apiSuccess(user), user.id, user.sessionVersion);
});
