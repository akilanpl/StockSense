import type { DataColumn } from "@/components/ui/DataTable";

export function columns(...headers: string[]): DataColumn[] {
  return headers.map((header) => ({
    id: header.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    header,
  }));
}
