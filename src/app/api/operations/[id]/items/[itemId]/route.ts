import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withApi, type RouteContext } from "@/server/http";
import { removeOperationItem, updateOperationItem } from "@/server/operations/operations";
import { parseInput } from "@/validations/common";
import { updateItemSchema } from "@/validations/operations";

export const PUT = withApi<RouteContext<{ id: string; itemId: string }>>(async (request, context) => {
  const { id, itemId } = await context.params;
  const input = parseInput(updateItemSchema, await readJsonBody(request));
  return apiSuccess(await updateOperationItem(id, itemId, input));
});

export const DELETE = withApi<RouteContext<{ id: string; itemId: string }>>(async (_request, context) => {
  const { id, itemId } = await context.params;
  return apiSuccess(await removeOperationItem(id, itemId));
});
