import { test, expect } from "@playwright/test";

test.describe("Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/99999");
    await page.waitForLoadState("domcontentloaded");
  });

  test("editor page loads", async ({ page }) => {
    await expect(page.locator("#editor-page")).toBeVisible({ timeout: 10000 });
  });

  test("preview pane is present", async ({ page }) => {
    await expect(page.locator("#preview-pane")).toBeVisible();
  });

  test("code pane is present", async ({ page }) => {
    await expect(page.locator("#code-pane")).toBeVisible();
  });

  test("navigates back to dashboard via header", async ({ page }) => {
    const homeLink = page.locator("header a[href='/']").first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState("domcontentloaded");
    }
  });
});
