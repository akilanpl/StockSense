import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

test("HTTP integration: SMTP verification, inventory lifecycle, ledger, reset and revocation", async ({ request }) => {
  expect(new URL(process.env.DATABASE_URL ?? "").pathname).toMatch(/(?:^|[_-])(test|review)(?:[_-]|$)/i);
  const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3187";
  const stamp = Date.now().toString(36), email = `http-${stamp}@example.test`, password = "local-test-password";
  const signup = await request.post("/api/auth/signup", { headers: { origin: base, "sec-fetch-site": "same-origin" }, data: { name: "Finals HTTP Test", email, password, confirmPassword: password } });
  expect(signup.status(), await signup.text()).toBe(201);
  async function mailCode() {
    let code = "";
    await expect.poll(() => {
      try {
        const lines = readFileSync(process.env.SMTP_TEST_OUTBOX!, "utf8").trim().split("\n").map((line) => JSON.parse(line));
        code = [...lines].reverse().find((message) => message.to === email)?.code ?? "";
      } catch { code = ""; }
      return code;
    }).toMatch(/^\d{6}$/);
    return code;
  }
  const verified = await request.post("/api/auth/verify-email", { data: { email, otp: await mailCode() } });
  expect(verified.status(), await verified.text()).toBe(200);
  expect((await request.get("/api/products/not-a-uuid")).status()).toBe(400);
  expect((await request.get("/api/products?categoryId=invalid")).status()).toBe(400);
  const oldCookies = await request.storageState();
  async function post(path: string, data: unknown) {
    const response = await request.post(path, { data });
    expect(response.status(), `${path}: ${await response.text()}`).toBe(201);
    return (await response.json()).data;
  }
  const category = await post("/api/categories", { name: `HTTP-${stamp}` });
  const unit = await post("/api/units", { code: `HTTP-${stamp}`, name: "Piece" });
  const product = await post("/api/products", { sku: `HTTP-${stamp}`, name: "Finals Widget", categoryId: category.id, unitOfMeasureId: unit.id });
  const warehouse = await post("/api/warehouses", { code: `HTTP-${stamp}`, name: "Finals Warehouse" });
  const a = await post("/api/locations", { warehouseId: warehouse.id, name: "Rack A", code: "A" });
  const b = await post("/api/locations", { warehouseId: warehouse.id, name: "Rack B", code: "B" });
  async function operation(type: string, quantity: string, source?: string, destination?: string) {
    const op = await post("/api/operations", { type, sourceLocationId: source, destinationLocationId: destination, items: [{ productId: product.id, quantity }] });
    expect((await request.post(`/api/operations/${op.id}/ready`)).status()).toBe(200);
    const result = await request.post(`/api/operations/${op.id}/validate`);
    expect(result.status(), await result.text()).toBe(200);
    expect((await result.json()).data.status).toBe("DONE");
    expect((await request.post(`/api/operations/${op.id}/validate`)).status()).toBe(409);
    return op.id;
  }
  await operation("RECEIPT", "100", undefined, a.id);
  await operation("TRANSFER", "30", a.id, b.id);
  await operation("DELIVERY", "20", b.id);
  await operation("ADJUSTMENT", "8", undefined, b.id);
  await operation("ADJUSTMENT", "8", undefined, b.id); // No change is valid, without a fifth ledger movement.
  const quants = (await (await request.get(`/api/stock?productId=${product.id}`)).json()).data;
  expect(quants.find((q: { locationId: string }) => q.locationId === a.id).quantity).toBe("70");
  expect(quants.find((q: { locationId: string }) => q.locationId === b.id).quantity).toBe("8");
  const moves = (await (await request.get(`/api/moves?productId=${product.id}`)).json()).data;
  expect(moves).toHaveLength(4);
  const blocked = await post("/api/operations", { type: "DELIVERY", sourceLocationId: b.id, items: [{ productId: product.id, quantity: "9" }] });
  await request.post(`/api/operations/${blocked.id}/ready`);
  expect((await request.post(`/api/operations/${blocked.id}/validate`)).status()).toBe(409);
  const blockedRecord = (await (await request.get(`/api/operations/${blocked.id}`)).json()).data;
  expect(blockedRecord.status).toBe("READY"); expect(blockedRecord.moves).toEqual([]);
  for (const path of ["/dashboard", "/stock", "/move-history"]) {
    const response = await request.get(path); expect(response.status()).toBe(200);
    const html = await response.text(); expect(html).toContain(product.sku); expect(html).not.toContain("The request could not be completed.");
  }
  expect((await request.post("/api/auth/forgot-password", { data: { email } })).status()).toBe(200);
  const nextPassword = "local-test-password-updated";
  expect((await request.post("/api/auth/reset-password", { data: { email, otp: await mailCode(), password: nextPassword, confirmPassword: nextPassword } })).status()).toBe(200);
  expect((await request.get("/api/products")).status()).toBe(401);
  expect((await request.post("/api/auth/login", { data: { email, password } })).status()).toBe(401);
  expect((await request.post("/api/auth/login", { data: { email, password: nextPassword } })).status()).toBe(200);
  expect(oldCookies.cookies).not.toEqual((await request.storageState()).cookies);
  mkdirSync(".gstack/tmp", { recursive: true });
  writeFileSync(".gstack/tmp/ui-fixture.json", JSON.stringify({ email, password: nextPassword, product, a, b }), { mode: 0o600 });
});
