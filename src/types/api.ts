import { z } from "zod";

const timestamp = z.string();

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const warehouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const locationTypeSchema = z.enum(["VIEW", "INTERNAL", "VIRTUAL"]);

export const locationSchema = z.object({
  id: z.string(),
  warehouseId: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  code: z.string(),
  type: locationTypeSchema,
  isActive: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const unitOfMeasureSchema = z.object({
  id: z.string(),
  code: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  unitOfMeasureId: z.string(),
  unitOfMeasureCode: z.string(),
  isActive: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const operationTypeSchema = z.enum(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]);
export const operationStatusSchema = z.enum(["DRAFT", "WAITING", "READY", "DONE", "CANCELED"]);
export const movementTypeSchema = operationTypeSchema;

export const operationItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  productName: z.string(),
  requestedQuantity: z.string(),
  processedQuantity: z.string(),
});

export const stockMoveSchema = z.object({
  id: z.string(),
  operationId: z.string(),
  operationReference: z.string().optional(),
  productId: z.string(),
  sku: z.string().optional(),
  sourceLocationId: z.string().nullable(),
  destinationLocationId: z.string().nullable(),
  quantity: z.string(),
  movementType: movementTypeSchema,
  createdAt: timestamp,
  completedAt: timestamp.nullable(),
});

export const stockOperationSchema = z.object({
  id: z.string(),
  reference: z.string(),
  type: operationTypeSchema,
  status: operationStatusSchema,
  partnerId: z.string().nullable(),
  partnerName: z.string().nullable(),
  sourceLocationId: z.string().nullable(),
  sourceLocationCode: z.string().nullable(),
  destinationLocationId: z.string().nullable(),
  destinationLocationCode: z.string().nullable(),
  createdById: z.string(),
  createdByName: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
  validatedAt: timestamp.nullable(),
  canceledAt: timestamp.nullable(),
  items: z.array(operationItemSchema),
  moves: z.array(stockMoveSchema).optional(),
});

export const stockQuantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  productName: z.string(),
  locationId: z.string(),
  locationCode: z.string(),
  warehouseId: z.string(),
  quantity: z.string(),
  updatedAt: timestamp,
});

export const lowStockItemSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  productName: z.string(),
  locationId: z.string(),
  locationCode: z.string(),
  quantity: z.string(),
  minimumQuantity: z.string(),
});

export const dashboardSchema = z.object({
  totalProductsInStock: z.number(),
  lowStockCount: z.number(),
  outOfStockCount: z.number(),
  pendingReceipts: z.number(),
  pendingDeliveries: z.number(),
  scheduledInternalTransfers: z.number(),
  lowStockItems: z.array(lowStockItemSchema),
});

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["INVENTORY_MANAGER", "WAREHOUSE_STAFF"]),
});

export const apiFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type Category = z.infer<typeof categorySchema>;
export type Warehouse = z.infer<typeof warehouseSchema>;
export type Location = z.infer<typeof locationSchema>;
export type LocationType = z.infer<typeof locationTypeSchema>;
export type UnitOfMeasure = z.infer<typeof unitOfMeasureSchema>;
export type Product = z.infer<typeof productSchema>;
export type OperationType = z.infer<typeof operationTypeSchema>;
export type OperationStatus = z.infer<typeof operationStatusSchema>;
export type MovementType = z.infer<typeof movementTypeSchema>;
export type OperationItem = z.infer<typeof operationItemSchema>;
export type StockMove = z.infer<typeof stockMoveSchema>;
export type StockOperation = z.infer<typeof stockOperationSchema>;
export type StockQuant = z.infer<typeof stockQuantSchema>;
export type LowStockItem = z.infer<typeof lowStockItemSchema>;
export type DashboardData = z.infer<typeof dashboardSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type ApiFailure = z.infer<typeof apiFailureSchema>;

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ProductListQuery = {
  categoryId?: string;
  q?: string;
};

export type LocationListQuery = {
  warehouseId?: string;
};

export type OperationListQuery = {
  type?: OperationType;
  status?: OperationStatus;
  sourceLocationId?: string;
  destinationLocationId?: string;
  warehouseId?: string;
  from?: string;
  to?: string;
};

export type MoveListQuery = {
  productId?: string;
  movementType?: MovementType;
  sourceLocationId?: string;
  destinationLocationId?: string;
  operationId?: string;
  from?: string;
  to?: string;
};

export type StockListQuery = {
  productId?: string;
  locationId?: string;
  warehouseId?: string;
};

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
};

export type CreateWarehouseInput = {
  name: string;
  code: string;
  address?: string | null;
  isActive?: boolean;
};

export type CreateLocationInput = {
  warehouseId: string;
  parentId?: string | null;
  name: string;
  code: string;
  type?: LocationType;
  isActive?: boolean;
};

export type UpdateLocationInput = {
  parentId?: string | null;
  name?: string;
  code?: string;
  type?: LocationType;
  isActive?: boolean;
};

export type CreateProductInput = {
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string;
  isActive?: boolean;
};

export type UpdateProductInput = {
  name?: string;
  sku?: string;
  categoryId?: string;
  unitOfMeasureId?: string;
  isActive?: boolean;
};

export type OperationItemInput = {
  productId: string;
  quantity: string | number;
};

export type CreateOperationInput = {
  type: OperationType;
  reference?: string;
  partnerId?: string | null;
  sourceLocationId?: string | null;
  destinationLocationId?: string | null;
  createdById?: string;
  items?: OperationItemInput[];
};

export type UpdateOperationInput = {
  reference?: string;
  partnerId?: string | null;
  sourceLocationId?: string | null;
  destinationLocationId?: string | null;
  status?: "WAITING" | "READY";
};

export type UpdateOperationItemInput = {
  productId?: string;
  quantity?: string | number;
};
