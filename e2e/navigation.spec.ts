import { test, expect } from "@playwright/test";

test.describe("Public Navigation", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/DealVault/);
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
  });

  test("reset password page renders", async ({ page }) => {
    await page.goto("/reset-password");
    // Should show the reset form (even without token, the page loads)
    await expect(page.locator("body")).toBeVisible();
  });
});
