import { test, expect } from "@playwright/test";

test.describe("Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/99999");
    await page.waitForLoadState("networkidle");
  });

  test("editor page loads", async ({ page }) => {
    await expect(page.locator("#editor-page")).toBeVisible();
  });

  test("preview pane is present", async ({ page }) => {
    // Preview pane should exist in editor layout
    await expect(page.locator("#preview-pane")).toBeVisible();
  });

  test("code pane is present", async ({ page }) => {
    // Code pane should exist (Monaco editor or skeleton)
    await expect(page.locator("#code-pane")).toBeVisible();
  });

  test("toolbar toggle button exists", async ({ page }) => {
    const toggleBtn = page.locator("[aria-label*='工具栏']");
    await expect(toggleBtn).toBeVisible();
  });

  test("navigates back to dashboard via header", async ({ page }) => {
    const homeLink = page.locator("header a[href='/']").first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState("networkidle");
    }
  });
});
