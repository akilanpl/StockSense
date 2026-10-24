export function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRole(role: string) {
  if (role === "INVENTORY_MANAGER") {
    return "Inventory manager";
  }

  if (role === "WAREHOUSE_STAFF") {
    return "Warehouse staff";
  }

  return formatLabel(role);
}

export function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
