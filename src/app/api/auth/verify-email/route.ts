import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withSession } from "@/server/auth/session";
import { verifyEmail } from "@/server/auth/verification";
import { withPublicApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { verifyEmailSchema } from "@/validations/auth";

export const POST = withPublicApi(async (request) => {
  const input = parseInput(verifyEmailSchema, await readJsonBody(request));
  const user = await verifyEmail(input.email, input.otp);
  return withSession(apiSuccess(user), user.id, user.sessionVersion);
});
