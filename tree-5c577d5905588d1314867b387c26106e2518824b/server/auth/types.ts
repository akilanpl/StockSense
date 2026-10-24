export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
};
