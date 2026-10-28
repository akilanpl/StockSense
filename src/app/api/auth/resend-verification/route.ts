import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { resendEmailVerification } from "@/server/auth/verification";
import { withPublicApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { resendVerificationSchema } from "@/validations/auth";

export const POST = withPublicApi(async (request) => {
  const input = parseInput(resendVerificationSchema, await readJsonBody(request));
  return apiSuccess(await resendEmailVerification(input.email));
});
