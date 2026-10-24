import { request } from "@/lib/api/http";
import {
  dashboardSchema,
  stockMoveSchema,
  stockQuantSchema,
  type MoveListQuery,
  type StockListQuery,
} from "@/types/api";

export function getStock(query: StockListQuery = {}) {
  return request("/api/stock", stockQuantSchema.array(), { query });
}

export function getMoves(query: MoveListQuery = {}) {
  return request("/api/moves", stockMoveSchema.array(), { query });
}

export function getDashboard() {
  return request("/api/dashboard", dashboardSchema);
}
