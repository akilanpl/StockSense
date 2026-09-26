import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withApi, type RouteContext } from "@/server/http";
import { addOperationItem } from "@/server/operations/operations";
import { parseInput } from "@/validations/common";
import { createItemSchema } from "@/validations/operations";

export const POST = withApi<RouteContext<{ id: string }>>(async (request, context) => {
  const { id } = await context.params;
  const input = parseInput(createItemSchema, await readJsonBody(request));
  return apiSuccess(await addOperationItem(id, input), 201);
});
