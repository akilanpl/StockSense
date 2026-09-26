import { request } from "@/lib/api/http";
import {
  categorySchema,
  locationSchema,
  productSchema,
  warehouseSchema,
  type CreateCategoryInput,
  type CreateLocationInput,
  type CreateProductInput,
  type CreateWarehouseInput,
  type LocationListQuery,
  type ProductListQuery,
  type UpdateLocationInput,
  type UpdateProductInput,
} from "@/types/api";
import { z } from "zod";

export function getProducts(query: ProductListQuery = {}) {
  return request("/api/products", z.array(productSchema), { query });
}

export function getProduct(id: string) {
  return request(`/api/products/${encodeURIComponent(id)}`, productSchema);
}

export function createProduct(input: CreateProductInput) {
  return request("/api/products", productSchema, { method: "POST", body: input });
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return request(`/api/products/${encodeURIComponent(id)}`, productSchema, {
    method: "PUT",
    body: input,
  });
}

export function getCategories() {
  return request("/api/categories", z.array(categorySchema));
}

export function getCategory(id: string) {
  return request(`/api/categories/${encodeURIComponent(id)}`, categorySchema);
}

export function createCategory(input: CreateCategoryInput) {
  return request("/api/categories", categorySchema, { method: "POST", body: input });
}

export function getWarehouses() {
  return request("/api/warehouses", z.array(warehouseSchema));
}

export function createWarehouse(input: CreateWarehouseInput) {
  return request("/api/warehouses", warehouseSchema, { method: "POST", body: input });
}

export function getLocations(query: LocationListQuery = {}) {
  return request("/api/locations", z.array(locationSchema), { query });
}

export function createLocation(input: CreateLocationInput) {
  return request("/api/locations", locationSchema, { method: "POST", body: input });
}

export function updateLocation(id: string, input: UpdateLocationInput) {
  return request(`/api/locations/${encodeURIComponent(id)}`, locationSchema, {
    method: "PUT",
    body: input,
  });
}
