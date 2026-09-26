import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { createLocation, listLocations } from "@/server/catalog/locations";
import { withApi } from "@/server/http";
import { readQuery } from "@/server/http/query";
import { parseInput } from "@/validations/common";
import { createLocationSchema } from "@/validations/catalog";

export const GET = withApi(async (request) => {
  const query = readQuery(request);
  return apiSuccess(await listLocations(query.warehouseId));
});

export const POST = withApi(async (request) => {
  const input = parseInput(createLocationSchema, await readJsonBody(request));
  return apiSuccess(await createLocation(input), 201);
});
