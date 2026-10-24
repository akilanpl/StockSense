import { z } from "zod";
import { idSchema, optionalText, requiredText } from "@/validations/common";

export const createCategorySchema = z.object({
  name: requiredText("Name"),
  description: optionalText,
});

export const createWarehouseSchema = z.object({
  name: requiredText("Name"),
  code: requiredText("Code"),
  address: optionalText,
  isActive: z.boolean().optional(),
});

export const createLocationSchema = z.object({
  warehouseId: idSchema,
  parentId: z.uuid("Parent location id is invalid.").nullable().optional(),
  name: requiredText("Name"),
  code: requiredText("Code"),
  type: z.enum(["VIEW", "INTERNAL", "VIRTUAL"]).optional(),
  isActive: z.boolean().optional(),
});

export const updateLocationSchema = z
  .object({
    parentId: z.uuid("Parent location id is invalid.").nullable().optional(),
    name: requiredText("Name").optional(),
    code: requiredText("Code").optional(),
    type: z.enum(["VIEW", "INTERNAL", "VIRTUAL"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one location field is required.",
  });

export const createProductSchema = z.object({
  name: requiredText("Name"),
  sku: requiredText("SKU"),
  categoryId: idSchema,
  unitOfMeasureId: idSchema,
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z
  .object({
    name: requiredText("Name").optional(),
    sku: requiredText("SKU").optional(),
    categoryId: idSchema.optional(),
    unitOfMeasureId: idSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one product field is required.",
  });
