import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { startEmailVerification } from "@/server/auth/verification";
import { registerUser } from "@/server/auth/users";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { signupSchema } from "@/validations/auth";

export const POST = withApi(async (request) => {
  const input = parseInput(signupSchema, await readJsonBody(request));
  const user = await registerUser(input);
  await startEmailVerification(user.id, user.email);
  return apiSuccess({ verificationRequired: true as const }, 201);
});
