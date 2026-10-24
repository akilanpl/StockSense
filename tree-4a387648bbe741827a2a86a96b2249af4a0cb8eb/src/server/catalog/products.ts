import { ApiError } from "@/server/api/errors";
import { serializeProduct } from "@/server/catalog/serialize";
import { getPrisma } from "@/server/db/prisma";

const productInclude = { category: true, unitOfMeasure: true } as const;

export async function listProducts(filters: { categoryId?: string; q?: string }) {
  const products = await getPrisma().product.findMany({
    where: {
      categoryId: filters.categoryId,
      OR: filters.q
        ? [
            { name: { contains: filters.q, mode: "insensitive" } },
            { sku: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: productInclude,
    orderBy: { sku: "asc" },
  });

  return products.map(serializeProduct);
}

export async function getProduct(id: string) {
  const product = await getPrisma().product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    throw new ApiError(404, "NOT_FOUND", "Product was not found.");
  }

  return serializeProduct(product);
}

export async function createProduct(input: {
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string;
  isActive?: boolean;
}) {
  await assertCatalogRefs(input.categoryId, input.unitOfMeasureId);

  const product = await getPrisma().product.create({
    data: {
      name: input.name,
      sku: input.sku,
      categoryId: input.categoryId,
      unitOfMeasureId: input.unitOfMeasureId,
      isActive: input.isActive ?? true,
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function updateProduct(
  id: string,
  input: {
    name?: string;
    sku?: string;
    categoryId?: string;
    unitOfMeasureId?: string;
    isActive?: boolean;
  },
) {
  const existing = await getPrisma().product.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Product was not found.");
  }

  await assertCatalogRefs(
    input.categoryId ?? existing.categoryId,
    input.unitOfMeasureId ?? existing.unitOfMeasureId,
  );

  const product = await getPrisma().product.update({
    where: { id },
    data: input,
    include: productInclude,
  });

  return serializeProduct(product);
}

async function assertCatalogRefs(categoryId: string, unitOfMeasureId: string) {
  const [category, unit] = await Promise.all([
    getPrisma().category.findUnique({ where: { id: categoryId } }),
    getPrisma().unitOfMeasure.findUnique({ where: { id: unitOfMeasureId } }),
  ]);

  if (!category) {
    throw new ApiError(404, "NOT_FOUND", "Category was not found.");
  }

  if (!unit) {
    throw new ApiError(404, "NOT_FOUND", "Unit of measure was not found.");
  }
}
