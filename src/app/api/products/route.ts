import { readJsonBody } from "@/server/api/request";
import { apiSuccess } from "@/server/api/response";
import { createProduct, listProducts } from "@/server/catalog/products";
import { withApi } from "@/server/http";
import { readQuery } from "@/server/http/query";
import { parseInput } from "@/validations/common";
import { createProductSchema } from "@/validations/catalog";

export const GET = withApi(async (request) => {
  const query = readQuery(request);
  const products = await listProducts({
    categoryId: query.categoryId,
    q: query.q,
  });
  return apiSuccess(products);
});

export const POST = withApi(async (request) => {
  const input = parseInput(createProductSchema, await readJsonBody(request));
  const product = await createProduct(input);
  return apiSuccess(product, 201);
});
