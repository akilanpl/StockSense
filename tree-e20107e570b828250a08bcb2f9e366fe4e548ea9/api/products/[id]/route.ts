import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { getProduct, updateProduct } from "@/server/catalog/products";
import { withApi, type RouteContext } from "@/server/http";
import { parseInput } from "@/validations/common";
import { updateProductSchema } from "@/validations/catalog";

export const GET = withApi<RouteContext<{ id: string }>>(async (_request, context) => {
  const { id } = await context.params;
  return apiSuccess(await getProduct(id));
});

export const PUT = withApi<RouteContext<{ id: string }>>(async (request, context) => {
  const { id } = await context.params;
  const input = parseInput(updateProductSchema, await readJsonBody(request));
  return apiSuccess(await updateProduct(id, input));
});
