import { readJsonBody } from "@/server/api/request";
import { apiErrorFromUnknown, notImplemented } from "@/server/api/response";

export function deferredRead(resource: string) {
  return notImplemented(resource);
}

export async function deferredWrite(request: Request, resource: string) {
  try {
    await readJsonBody(request);
    return notImplemented(resource);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
