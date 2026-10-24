import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { requestPasswordReset } from "@/server/auth/password-reset";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { forgotPasswordSchema } from "@/validations/auth";

export const POST = withApi(async (request) => {
  const input = parseInput(forgotPasswordSchema, await readJsonBody(request));
  return apiSuccess(await requestPasswordReset(input.email));
});