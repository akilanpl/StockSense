import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withSession } from "@/server/auth/session";
import { authenticate } from "@/server/auth/users";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { loginSchema } from "@/validations/auth";

export const POST = withApi(async (request) => {
  const input = parseInput(loginSchema, await readJsonBody(request));
  const user = await authenticate(input.email, input.password);
  return withSession(apiSuccess(user), user.id);
});
