import { apiSuccess } from "@/server/api/response";
import { getPrisma } from "@/server/db/prisma";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { z } from "zod";

export const GET = withApi(async (request) => {
  const { type } = parseInput(z.object({ type: z.enum(["SUPPLIER", "CUSTOMER"]).optional() }), Object.fromEntries(new URL(request.url).searchParams));
  return apiSuccess(await getPrisma().partner.findMany({ where: { type }, orderBy: { name: "asc" }, select: { id: true, name: true, type: true } }));
});
