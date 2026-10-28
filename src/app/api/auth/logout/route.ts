import { apiSuccess } from "@/server/api/response";
import { clearSession } from "@/server/auth/session";
import { withPublicApi } from "@/server/http";

export const POST = withPublicApi(async () => {
  return clearSession(apiSuccess({ signedOut: true }));
});
