import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e", timeout: 120_000, workers: 1, retries: 0,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3187", trace: "retain-on-failure", screenshot: "only-on-failure" },
});
