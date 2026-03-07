import { test, expect } from "@playwright/test";

test.describe("API Documentation", () => {
  test("api docs page loads", async ({ page }) => {
    await page.goto("/api-docs");
    await expect(page.getByText("DealVault API")).toBeVisible();
  });

  test("api docs JSON endpoint returns valid OpenAPI spec", async ({ request }) => {
    const response = await request.get("/api/docs");
    expect(response.ok()).toBeTruthy();

    const spec = await response.json();
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.title).toBe("DealVault API");
    expect(spec.paths).toBeDefined();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(10);
  });

  test("api docs page shows endpoint groups", async ({ page }) => {
    await page.goto("/api-docs");
    await expect(page.getByText("Auth")).toBeVisible();
    await expect(page.getByText("Deals")).toBeVisible();
    await expect(page.getByText("Documents")).toBeVisible();
  });
});
