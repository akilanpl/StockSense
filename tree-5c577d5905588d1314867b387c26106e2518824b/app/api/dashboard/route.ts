import { apiSuccess } from "@/server/api/response";
import { withApi } from "@/server/http";
import { getDashboard } from "@/server/inventory/dashboard";

export const GET = withApi(async () => apiSuccess(await getDashboard()));
