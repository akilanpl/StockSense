import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("signup, catalog, receive, transfer, deliver, reconcile, and ledger", async ({ page }) => {
  expect(new URL(process.env.DATABASE_URL ?? "").pathname).toMatch(/(?:^|[_-])(test|review)(?:[_-]|$)/i);
  const stamp = Date.now().toString(36), email = `browser-${stamp}@example.test`, password = "browser-test-password";
  await page.goto("/signup");
  await page.getByLabel("Name", { exact: true }).fill("Demo Manager");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/verify-email/);
  // SMTP fixture captures the message delivered by the real Nodemailer transport.
  let code = "";
  await expect.poll(() => {
    try {
      const messages = readFileSync(process.env.SMTP_TEST_OUTBOX!, "utf8").trim().split("\n").map((line) => JSON.parse(line));
      code = [...messages].reverse().find((message) => message.to === email)?.code ?? "";
    } catch { code = ""; }
    return code;
  }).toMatch(/^\d{6}$/);
  await page.getByLabel("Verification code", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

  const api = page.request;
  const warehouse = await api.post("/api/warehouses", { data: { code: `BROWSER-${stamp}`, name: `Browser ${stamp}` } });
  expect(warehouse.status()).toBe(201); const wh = (await warehouse.json()).data;
  async function location(code: string) {
    const response = await api.post("/api/locations", { data: { warehouseId: wh.id, code, name: code, type: "INTERNAL" } });
    expect(response.status()).toBe(201); return (await response.json()).data;
  }
  const a = await location(`A-${stamp}`), b = await location(`B-${stamp}`);
  await page.goto("/products");
  async function product(sku: string, first: boolean) {
    await page.getByRole("button", { name: "Add Product", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add product", exact: true });
    await dialog.getByLabel("Name", { exact: true }).fill(`Finals Widget ${sku}`);
    await dialog.getByLabel("SKU", { exact: true }).fill(sku);
    if (first) {
      await dialog.getByLabel("New category", { exact: true }).fill(`Finals ${stamp}`);
      await dialog.getByLabel("New unit code", { exact: true }).fill(`PCS-${stamp}`);
    }
    await dialog.getByRole("button", { name: "Save product", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("link", { name: sku, exact: true })).toBeVisible();
  }
  await product(`FINALS-${stamp}`, true);
  await product(`SECOND-${stamp}`, false); // Regression: reopening the modal must not remain pending.
  const products = (await (await api.get(`/api/products?q=FINALS-${stamp}`)).json()).data;
  const productId = products[0].id;

  async function operation(section: string, type: string, quantity: string, source?: string, destination?: string) {
    const reference = `${type}-${stamp}`;
    await page.goto(`/${section}`);
    await page.getByRole("button", { name: new RegExp(`Create ${type === "ADJUSTMENT" ? "adjustment" : type}`, "i") }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Reference", { exact: true }).fill(reference);
    if (source) await dialog.getByLabel("Source Location", { exact: true }).selectOption(source);
    if (destination) await dialog.getByLabel(type === "ADJUSTMENT" ? "Location" : /^Destination location$/i, { exact: true }).selectOption(destination);
    await dialog.getByLabel("Product", { exact: true }).selectOption(productId);
    await dialog.getByLabel(type === "ADJUSTMENT" ? "Counted quantity" : "Quantity", { exact: true }).fill(quantity);
    await dialog.getByRole("button", { name: /^Save draft$/i }).click();
    await expect(dialog).not.toBeVisible();
    await page.getByRole("link", { name: reference, exact: true }).click();
    await page.getByRole("button", { name: /Mark (as )?ready/i }).click();
    await expect(page.getByRole("button", { name: "Validate", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Validate", exact: true }).click();
    await expect(page.getByRole("button", { name: "Validate", exact: true })).not.toBeVisible();
    const record = (await (await api.get(`/api/operations?type=${type}`)).json()).data.find((op: { reference: string }) => op.reference === reference);
    expect(record.status).toBe("DONE"); return record;
  }
  await operation("receipts", "RECEIPT", "100", undefined, a.id);
  await operation("transfers", "TRANSFER", "30", a.id, b.id);
  await operation("deliveries", "DELIVERY", "20", b.id);
  await operation("adjustments", "ADJUSTMENT", "8", undefined, b.id);
  const stock = (await (await api.get(`/api/stock?productId=${productId}`)).json()).data;
  expect(stock.find((q: { locationId: string }) => q.locationId === a.id).quantity).toBe("70");
  expect(stock.find((q: { locationId: string }) => q.locationId === b.id).quantity).toBe("8");
  const moves = (await (await api.get(`/api/moves?productId=${productId}`)).json()).data;
  expect(moves).toHaveLength(4);
  expect(new Set(moves.map((m: { movementType: string }) => m.movementType)).size).toBe(4);
  for (const path of ["/stock", "/move-history", "/dashboard"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: /couldn.t load|something went wrong/i })).toHaveCount(0);
    await expect(page.getByText(`FINALS-${stamp}`, { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({ path: "test-results/finals-dashboard.png", fullPage: true });
  await test.step("insufficient stock leaves status and ledger unchanged", async () => {
    const response = await api.post("/api/operations", { data: { type: "DELIVERY", sourceLocationId: b.id, items: [{ productId, quantity: "9" }] } });
    const id = (await response.json()).data.id;
    expect((await api.post(`/api/operations/${id}/ready`)).ok()).toBeTruthy();
    expect((await api.post(`/api/operations/${id}/validate`)).status()).toBe(409);
    const record = (await (await api.get(`/api/operations/${id}`)).json()).data;
    expect(record.status).toBe("READY"); expect(record.moves).toHaveLength(0);
  });
});
