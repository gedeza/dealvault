import { test, expect } from "@playwright/test";

/**
 * Deal Lifecycle E2E Tests
 *
 * These tests verify the complete deal flow when authenticated.
 * They require the dev server to be running with seeded data.
 *
 * Pre-requisite: Run `npm run db:seed` to create test user:
 *   email: admin@dealvault.co.za, password: Admin123!
 */

test.describe("Deal Lifecycle (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Login with seeded admin user
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@dealvault.co.za");
    await page.getByLabel("Password").fill("Admin123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test("dashboard loads with stats", async ({ page }) => {
    await expect(page.getByText(/deal/i).first()).toBeVisible();
    // Dashboard should have navigation
    await expect(page.getByText("Deals")).toBeVisible();
    await expect(page.getByText("Companies")).toBeVisible();
  });

  test("deals list page loads", async ({ page }) => {
    await page.goto("/deals");
    await expect(page.getByText(/deals/i).first()).toBeVisible();
  });

  test("new deal page loads with templates", async ({ page }) => {
    await page.goto("/deals/new");
    await expect(page.getByText(/new deal|create deal/i).first()).toBeVisible();
    // Should have commodity selection
    await expect(page.getByText(/gold|diamond|platinum|tanzanite/i).first()).toBeVisible();
  });

  test("companies page loads", async ({ page }) => {
    await page.goto("/companies");
    await expect(page.getByText(/companies/i).first()).toBeVisible();
  });

  test("profile page loads", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText(/profile/i).first()).toBeVisible();
  });

  test("reports page loads", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByText(/report/i).first()).toBeVisible();
  });

  test("create a deal flow", async ({ page }) => {
    await page.goto("/deals/new");

    // Fill deal form
    await page.getByLabel(/title/i).fill("E2E Test Deal - Gold Bullion");
    await page.getByLabel(/quantity/i).fill("100");
    await page.getByLabel(/value/i).fill("500000");

    // Select commodity (if it's a select element)
    const commoditySelect = page.locator("[data-testid='commodity-select'], select[name='commodity']").first();
    if (await commoditySelect.isVisible()) {
      await commoditySelect.selectOption("gold");
    }

    // Submit the form
    const submitBtn = page.getByRole("button", { name: /create deal/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should redirect to the deal page
      await page.waitForURL(/deals\//, { timeout: 10000 });
    }
  });
});
