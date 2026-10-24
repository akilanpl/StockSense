import { z } from "zod";
import { idSchema, requiredText } from "@/validations/common";

const locationId = z.uuid("Location id is invalid.").nullable().optional();

export const operationItemInputSchema = z.object({
  productId: idSchema,
  quantity: z.union([z.string(), z.number()]),
});

export const createOperationSchema = z.object({
  type: z.enum(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]),
  reference: requiredText("Reference").optional(),
  partnerId: z.uuid("Partner id is invalid.").nullable().optional(),
  sourceLocationId: locationId,
  destinationLocationId: locationId,
  createdById: idSchema.optional(),
  items: z.array(operationItemInputSchema).optional(),
});

export const updateOperationSchema = z
  .object({
    reference: requiredText("Reference").optional(),
    partnerId: z.uuid("Partner id is invalid.").nullable().optional(),
    sourceLocationId: locationId,
    destinationLocationId: locationId,
    status: z.enum(["WAITING", "READY"]).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one operation field is required.",
  });

export const createItemSchema = operationItemInputSchema;

export const updateItemSchema = z
  .object({
    productId: idSchema.optional(),
    quantity: z.union([z.string(), z.number()]).optional(),
  })
  .refine((value) => value.productId !== undefined || value.quantity !== undefined, {
    message: "A product or quantity is required.",
  });
