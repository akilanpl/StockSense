import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { updateLocation } from "@/server/catalog/locations";
import { withApi, type RouteContext } from "@/server/http";
import { parseInput } from "@/validations/common";
import { updateLocationSchema } from "@/validations/catalog";

export const PUT = withApi<RouteContext<{ id: string }>>(async (request, context) => {
  const { id } = await context.params;
  const input = parseInput(updateLocationSchema, await readJsonBody(request));
  return apiSuccess(await updateLocation(id, input));
});
