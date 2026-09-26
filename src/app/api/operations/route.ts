import { deferredRead, deferredWrite } from "@/server/api/handlers";

export function GET() {
  return deferredRead("Operations");
}

export function POST(request: Request) {
  return deferredWrite(request, "Operations");
}
