import { apiSuccess } from "@/server/api/response";
import { withApi, type RouteContext } from "@/server/http";
import { requireUser } from "@/server/auth";
import { markOperationReady } from "@/server/operations/operations";

export const POST = withApi<RouteContext<{ id: string }>>(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  return apiSuccess(await markOperationReady(id));
});
