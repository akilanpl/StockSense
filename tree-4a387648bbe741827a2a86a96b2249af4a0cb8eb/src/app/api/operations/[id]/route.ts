import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withApi, type RouteContext } from "@/server/http";
import { requireUser } from "@/server/auth";
import { getOperation, updateOperation } from "@/server/operations/operations";
import { parseInput } from "@/validations/common";
import { updateOperationSchema } from "@/validations/operations";

export const GET = withApi<RouteContext<{ id: string }>>(async (_request, context) => {
  const { id } = await context.params;
  return apiSuccess(await getOperation(id));
});

export const PUT = withApi<RouteContext<{ id: string }>>(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const input = parseInput(updateOperationSchema, await readJsonBody(request));
  return apiSuccess(await updateOperation(id, input));
});
