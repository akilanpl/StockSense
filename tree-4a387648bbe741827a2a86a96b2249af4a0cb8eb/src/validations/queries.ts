import { z } from "zod";

const optionalId = z.uuid("Filter id is invalid.").optional();
const optionalDate = z.iso.datetime({ message: "Date filters must be ISO-8601 timestamps." }).optional();

export const operationQuerySchema = z.object({
  type: z.enum(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]).optional(),
  status: z.enum(["DRAFT", "WAITING", "READY", "DONE", "CANCELED"]).optional(),
  sourceLocationId: optionalId,
  destinationLocationId: optionalId,
  warehouseId: optionalId,
  from: optionalDate,
  to: optionalDate,
});

export const moveQuerySchema = z.object({
  productId: optionalId,
  movementType: z.enum(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]).optional(),
  sourceLocationId: optionalId,
  destinationLocationId: optionalId,
  operationId: optionalId,
  from: optionalDate,
  to: optionalDate,
});

export const stockQuerySchema = z.object({
  productId: optionalId,
  locationId: optionalId,
  warehouseId: optionalId,
});
