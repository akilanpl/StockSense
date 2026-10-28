export type AuthUser = {
  id: string;
  name: string;
  email: string;
  sessionVersion?: number;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
};
