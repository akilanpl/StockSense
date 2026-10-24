import { apiSuccess } from "@/server/api/response";
import { getCategory } from "@/server/catalog/categories";
import { withApi, type RouteContext } from "@/server/http";

export const GET = withApi<RouteContext<{ id: string }>>(async (_request, context) => {
  const { id } = await context.params;
  return apiSuccess(await getCategory(id));
});
