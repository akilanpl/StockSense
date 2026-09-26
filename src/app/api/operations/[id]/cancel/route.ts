import { apiSuccess } from "@/server/api/response";
import { withApi, type RouteContext } from "@/server/http";
import { cancelOperation } from "@/server/operations/operations";

export const POST = withApi<RouteContext<{ id: string }>>(async (_request, context) => {
  const { id } = await context.params;
  return apiSuccess(await cancelOperation(id));
});
