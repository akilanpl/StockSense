import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { resetPassword } from "@/server/auth/verification";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { resetPasswordSchema } from "@/validations/auth";

export const POST = withApi(async (request) => {
  const input = parseInput(resetPasswordSchema, await readJsonBody(request));
  return apiSuccess(await resetPassword(input));
});
