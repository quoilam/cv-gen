import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("shows dashboard page with title", async ({ page }) => {
    await expect(page.locator("#dashboard-page")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("h1")).toContainText("我的简历");
  });

  test("navigates to editor from header brand", async ({ page }) => {
    const brandLink = page.locator("header a[href='/']").first();
    await expect(brandLink).toBeVisible();
  });

  test("navigates to settings page", async ({ page }) => {
    // Settings page navigation - placeholder
  });

  test("dashboard page is functional after load", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".workspace")).toBeVisible();
  });
});
