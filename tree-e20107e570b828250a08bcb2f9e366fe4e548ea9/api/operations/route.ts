import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { withApi } from "@/server/http";
import { readQuery } from "@/server/http/query";
import { requireUser } from "@/server/auth";
import { createOperation, listOperations } from "@/server/operations/operations";
import { parseInput } from "@/validations/common";
import { createOperationSchema } from "@/validations/operations";
import { operationQuerySchema } from "@/validations/queries";

export const GET = withApi(async (request) => {
  const filters = parseInput(operationQuerySchema, readQuery(request));
  return apiSuccess(await listOperations(filters));
});

export const POST = withApi(async (request) => {
  const user = await requireUser(request);
  const input = parseInput(createOperationSchema, await readJsonBody(request));
  return apiSuccess(await createOperation({ ...input, createdById: user.id }), 201);
});
