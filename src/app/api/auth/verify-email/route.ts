import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withSession } from "@/server/auth/session";
import { verifyEmail } from "@/server/auth/verification";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { verifyEmailSchema } from "@/validations/auth";

export const POST = withApi(async (request) => {
  const input = parseInput(verifyEmailSchema, await readJsonBody(request));
  const user = await verifyEmail(input.email, input.otp);
  return withSession(apiSuccess(user), user.id);
});
