import { deferredRead } from "@/server/api/handlers";

export function GET() {
  return deferredRead("Stock moves");
}
