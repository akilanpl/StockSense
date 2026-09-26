import { deferredRead } from "@/server/api/handlers";
import { readSearchParam } from "@/server/api/request";

export function GET(request: Request) {
  readSearchParam(request, "warehouse");
  return deferredRead("Dashboard");
}
