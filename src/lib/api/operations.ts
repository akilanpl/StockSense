import { request } from "@/lib/api/http";
import {
  stockOperationSchema,
  type CreateOperationInput,
  type OperationItemInput,
  type OperationListQuery,
  type UpdateOperationInput,
  type UpdateOperationItemInput,
} from "@/types/api";

export function getOperations(query: OperationListQuery = {}) {
  return request("/api/operations", stockOperationSchema.array(), { query });
}

export function getOperation(id: string) {
  return request(`/api/operations/${encodeURIComponent(id)}`, stockOperationSchema);
}

export function createOperation(input: CreateOperationInput) {
  return request("/api/operations", stockOperationSchema, { method: "POST", body: input });
}

export function updateOperation(id: string, input: UpdateOperationInput) {
  return request(`/api/operations/${encodeURIComponent(id)}`, stockOperationSchema, {
    method: "PUT",
    body: input,
  });
}

export function addOperationItem(operationId: string, input: OperationItemInput) {
  return request(`/api/operations/${encodeURIComponent(operationId)}/items`, stockOperationSchema, {
    method: "POST",
    body: input,
  });
}

export function updateOperationItem(
  operationId: string,
  itemId: string,
  input: UpdateOperationItemInput,
) {
  return request(
    `/api/operations/${encodeURIComponent(operationId)}/items/${encodeURIComponent(itemId)}`,
    stockOperationSchema,
    { method: "PUT", body: input },
  );
}

export function deleteOperationItem(operationId: string, itemId: string) {
  return request(
    `/api/operations/${encodeURIComponent(operationId)}/items/${encodeURIComponent(itemId)}`,
    stockOperationSchema,
    { method: "DELETE" },
  );
}

export function markOperationReady(id: string) {
  return request(`/api/operations/${encodeURIComponent(id)}/ready`, stockOperationSchema, {
    method: "POST",
  });
}

export function validateOperation(id: string) {
  return request(`/api/operations/${encodeURIComponent(id)}/validate`, stockOperationSchema, {
    method: "POST",
  });
}

export function cancelOperation(id: string) {
  return request(`/api/operations/${encodeURIComponent(id)}/cancel`, stockOperationSchema, {
    method: "POST",
  });
}
