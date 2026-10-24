import { apiSuccess } from "@/server/api/response";
import { withApi } from "@/server/http";
import { readQuery } from "@/server/http/query";
import { listMoves } from "@/server/inventory/queries";
import { parseInput } from "@/validations/common";
import { moveQuerySchema } from "@/validations/queries";

export const GET = withApi(async (request) => {
  const filters = parseInput(moveQuerySchema, readQuery(request));
  return apiSuccess(await listMoves(filters));
});
