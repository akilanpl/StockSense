import { apiSuccess } from "@/server/api/response";
import { ApiError } from "@/server/api/errors";
import { getCurrentUser } from "@/server/auth";
import { withApi } from "@/server/http";

export const GET = withApi(async (request) => {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new ApiError(401, "UNAUTHENTICATED", "You need to sign in before continuing.");
  }

  return apiSuccess(user);
});
