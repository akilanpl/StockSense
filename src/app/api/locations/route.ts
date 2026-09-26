import { deferredRead, deferredWrite } from "@/server/api/handlers";

export function GET() {
  return deferredRead("Locations");
}

export function POST(request: Request) {
  return deferredWrite(request, "Locations");
}
