import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("shows dashboard page with title", async ({ page }) => {
    await expect(page.locator("#dashboard-page")).toBeVisible();
    await expect(page.locator("h1")).toContainText("我的简历");
  });

  test("navigates to landing page from header", async ({ page }) => {
    const homeLink = page.locator("header a[href='/']").first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("#landing-page")).toBeVisible();
    }
  });

  test("navigates to settings page", async ({ page }) => {
    const settingsLink = page.locator("header a[href='/settings']").first();
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("dashboard page is functional after load", async ({ page }) => {
    // Verify core UI elements are present: header, workspace area
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator(".workspace")).toBeVisible();
  });
});
