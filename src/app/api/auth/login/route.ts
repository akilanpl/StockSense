import { enforceLoginLimit } from "@/server/auth/login-limit";
import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withSession } from "@/server/auth/session";
import { authenticate } from "@/server/auth/users";
import { withPublicApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { loginSchema } from "@/validations/auth";

export const POST = withPublicApi(async (request) => {
  const input = parseInput(loginSchema, await readJsonBody(request));
  await enforceLoginLimit(input.email);
  const user = await authenticate(input.email, input.password);
  return withSession(apiSuccess(user), user.id, user.sessionVersion);
});
