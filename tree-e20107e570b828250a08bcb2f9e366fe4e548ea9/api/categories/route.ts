import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { createCategory, listCategories } from "@/server/catalog/categories";
import { withApi } from "@/server/http";
import { parseInput } from "@/validations/common";
import { createCategorySchema } from "@/validations/catalog";

export const GET = withApi(async () => apiSuccess(await listCategories()));

export const POST = withApi(async (request) => {
  const input = parseInput(createCategorySchema, await readJsonBody(request));
  return apiSuccess(await createCategory(input), 201);
});
