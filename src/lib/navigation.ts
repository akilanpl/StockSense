export type NavIcon =
  | "dashboard"
  | "products"
  | "receipts"
  | "deliveries"
  | "transfers"
  | "adjustments"
  | "history"
  | "stock"
  | "warehouses"
  | "locations"
  | "settings"
  | "profile";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { href: "/receipts", label: "Receipts", icon: "receipts" },
      { href: "/deliveries", label: "Deliveries", icon: "deliveries" },
      { href: "/transfers", label: "Transfers", icon: "transfers" },
      { href: "/adjustments", label: "Adjustments", icon: "adjustments" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    items: [
      { href: "/products", label: "Products", icon: "products" },
      { href: "/stock", label: "Stock", icon: "stock" },
      { href: "/move-history", label: "Move History", icon: "history" },
    ],
  },
  {
    id: "master-data",
    label: "Master data",
    items: [
      { href: "/warehouses", label: "Warehouses", icon: "warehouses" },
      { href: "/locations", label: "Locations", icon: "locations" },
    ],
  },
];

export const accountNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export const allNavItems: NavItem[] = [
  ...navSections.flatMap((section) => section.items),
  ...accountNav,
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleForPath(pathname: string) {
  const match = allNavItems.find((item) => isNavActive(pathname, item.href));
  return match?.label ?? "StockSense";
}
