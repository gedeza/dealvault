import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("hero section displays correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Secure Deal Rooms");
    await expect(page.getByText("Get Started Free")).toBeVisible();
    await expect(page.getByText("See How It Works")).toBeVisible();
  });

  test("features section lists all features", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Secure Deal Rooms")).toBeVisible();
    await expect(page.getByText("Escrow Workflow")).toBeVisible();
    await expect(page.getByText("Chain of Custody")).toBeVisible();
    await expect(page.getByText("AI Deal Room Assistant")).toBeVisible();
    await expect(page.getByText("Document Intelligence")).toBeVisible();
  });

  test("pricing section shows three tiers", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Free").first()).toBeVisible();
    await expect(page.getByText("Pro").first()).toBeVisible();
    await expect(page.getByText("Enterprise").first()).toBeVisible();
    await expect(page.getByText("Coming Soon")).toBeVisible();
  });

  test("how it works section shows 6 phases", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("How DealVault Works")).toBeVisible();
    await expect(page.getByText("Listing").first()).toBeVisible();
    await expect(page.getByText("Fund Release").first()).toBeVisible();
  });

  test("commodities section shows all four types", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Gold").first()).toBeVisible();
    await expect(page.getByText("Diamonds").first()).toBeVisible();
    await expect(page.getByText("Platinum").first()).toBeVisible();
    await expect(page.getByText("Tanzanite").first()).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/login/);
  });

  test("public stats API returns data", async ({ request }) => {
    const response = await request.get("/api/public/stats");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("totalDeals");
    expect(data).toHaveProperty("totalUsers");
    expect(data).toHaveProperty("totalDealValue");
  });
});
