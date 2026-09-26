import { apiSuccess } from "@/server/api/response";
import { withApi } from "@/server/http";
import { readQuery } from "@/server/http/query";
import { listStock } from "@/server/inventory/queries";
import { parseInput } from "@/validations/common";
import { stockQuerySchema } from "@/validations/queries";

export const GET = withApi(async (request) => {
  const filters = parseInput(stockQuerySchema, readQuery(request));
  return apiSuccess(await listStock(filters));
});
