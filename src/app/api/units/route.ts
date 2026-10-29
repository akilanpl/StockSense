import { apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/api/request";
import { getPrisma } from "@/server/db/prisma";
import { withApi } from "@/server/http";
import { parseInput, requiredText } from "@/validations/common";
import { z } from "zod";

export const GET = withApi(async () => apiSuccess(await getPrisma().unitOfMeasure.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true } })));
export const POST = withApi(async (request) => {
  const input = parseInput(z.object({ code: requiredText("Unit code"), name: requiredText("Unit name") }), await readJsonBody(request));
  return apiSuccess(await getPrisma().unitOfMeasure.create({ data: input, select: { id: true, code: true } }), 201);
});
