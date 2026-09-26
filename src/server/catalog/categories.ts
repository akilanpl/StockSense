import { ApiError } from "@/server/api/errors";
import { serializeCategory } from "@/server/catalog/serialize";
import { getPrisma } from "@/server/db/prisma";

export async function listCategories() {
  const categories = await getPrisma().category.findMany({ orderBy: { name: "asc" } });
  return categories.map(serializeCategory);
}

export async function getCategory(id: string) {
  const category = await getPrisma().category.findUnique({ where: { id } });

  if (!category) {
    throw new ApiError(404, "NOT_FOUND", "Category was not found.");
  }

  return serializeCategory(category);
}

export async function createCategory(input: { name: string; description?: string | null }) {
  const category = await getPrisma().category.create({
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });

  return serializeCategory(category);
}
