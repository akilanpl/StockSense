import { deferredRead, deferredWrite } from "@/server/api/handlers";

export function GET() {
  return deferredRead("Warehouses");
}

export function POST(request: Request) {
  return deferredWrite(request, "Warehouses");
}
