import { deferredRead, deferredWrite } from "@/server/api/handlers";

export function GET() {
  return deferredRead("Categories");
}

export function POST(request: Request) {
  return deferredWrite(request, "Categories");
}
