import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { resendEmailVerification } from "@/server/auth/verification";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { resendVerificationSchema } from "@/validations/auth";

export const POST = withApi(async (request) => {
  const input = parseInput(resendVerificationSchema, await readJsonBody(request));
  return apiSuccess(await resendEmailVerification(input.email));
});
