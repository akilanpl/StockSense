import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { createWarehouse, listWarehouses } from "@/server/catalog/warehouses";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { createWarehouseSchema } from "@/validations/catalog";

export const GET = withApi(async () => apiSuccess(await listWarehouses()));

export const POST = withApi(async (request) => {
  const input = parseInput(createWarehouseSchema, await readJsonBody(request));
  return apiSuccess(await createWarehouse(input), 201);
});
