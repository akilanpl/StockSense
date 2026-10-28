import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { resetPassword } from "@/server/auth/verification";
import { withPublicApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { resetPasswordSchema } from "@/validations/auth";

export const POST = withPublicApi(async (request) => {
  const input = parseInput(resetPasswordSchema, await readJsonBody(request));
  return apiSuccess(await resetPassword(input));
});
