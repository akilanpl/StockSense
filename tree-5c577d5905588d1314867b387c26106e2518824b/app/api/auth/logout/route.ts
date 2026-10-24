import { apiSuccess } from "@/server/api/response";
import { clearSession } from "@/server/auth/session";
import { withApi } from "@/server/http";

export const POST = withApi(async () => {
  return clearSession(apiSuccess({ signedOut: true }));
});
