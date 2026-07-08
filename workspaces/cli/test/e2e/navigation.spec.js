// Import Third-party Dependencies
import { test, expect } from "@playwright/test";

// CONSTANTS
const kDataMenus = [
  "home--view",
  "network--view",
  "tree--view",
  "warnings--view"
];
const kAlwaysVisibleMenus = [
  "search--view",
  "settings--view"
];

test.describe("[navigation] with data", () => {
  test.beforeEach(async({ page }) => {
    await page.goto("/");
    await page.waitForSelector(`[data-menu="network--view"].active`);
  });

  test("all tabs are visible in the sidebar", async({ page }) => {
    for (const menu of [...kDataMenus, ...kAlwaysVisibleMenus]) {
      await expect(page.locator(`[data-menu="${menu}"]`)).not.toContainClass("hidden");
    }
  });

  test("network view is active by default", async({ page }) => {
    await expect(page.locator("#network--view")).not.toContainClass("hidden");
    await expect(page.locator(`[data-menu="network--view"]`)).toContainClass("active");
  });

  test("clicking the settings tab shows the settings view", async({ page }) => {
    await page.locator(`[data-menu="settings--view"]`).click();

    await expect(page.locator("#settings--view")).not.toContainClass("hidden");
    await expect(page.locator("#network--view")).toContainClass("hidden");
  });

  test("pressing S navigates to the settings view", async({ page }) => {
    await page.keyboard.press("s");

    await expect(page.locator("#settings--view")).not.toContainClass("hidden");
  });

  test("pressing A navigates to the warnings view", async({ page }) => {
    await page.keyboard.press("a");

    await expect(page.locator("#warnings--view")).not.toContainClass("hidden");
  });
});

test.describe("[navigation] without data", () => {
  test.beforeEach(async({ page }) => {
    await page.route("**/data", (route) => route.fulfill({ status: 204 }));
    await page.goto("/");
    await page.waitForSelector(`[data-menu="search--view"].active`);
  });

  test("data-dependent tabs are hidden in the sidebar", async({ page }) => {
    for (const menu of kDataMenus) {
      await expect(page.locator(`[data-menu="${menu}"]`)).toContainClass("hidden");
    }
  });

  test("always visible menus tabs remain visible", async({ page }) => {
    for (const menu of kAlwaysVisibleMenus) {
      await expect(page.locator(`[data-menu="${menu}"]`)).not.toContainClass("hidden");
    }
  });

  test("search view is the active view", async({ page }) => {
    await expect(page.locator("#search--view")).not.toContainClass("hidden");
    await expect(page.locator(`[data-menu="search--view"]`)).toContainClass("active");
  });
});
