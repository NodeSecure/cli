// Import Third-party Dependencies
import { test, expect } from "@playwright/test";

test.describe("settings page", () => {
  test.beforeEach(async({ page }) => {
    await page.goto("/");
    await page.waitForSelector(`[data-menu="network--view"].active`);
    await page.locator(`[data-menu="settings--view"]`).click();
    await expect(page.locator("#settings--view")).not.toContainClass("hidden");
  });

  test("renders the default package menu dropdown", async({ page }) => {
    await expect(page.locator("#default_package_menu")).toBeVisible();
  });

  test("renders the theme selector dropdown", async({ page }) => {
    await expect(page.locator("#theme_selector")).toBeVisible();
  });

  test("renders warning filter checkboxes from js-x-ray", async({ page }) => {
    const checkboxes = page.locator("input[name='warnings']");

    await expect(checkboxes.first()).toBeVisible();
    expect(await checkboxes.count()).toBeGreaterThan(0);
  });

  test("renders all flag filter checkboxes", async({ page }) => {
    await expect(page.locator("#hasManyPublishers")).toBeVisible();
    await expect(page.locator("#hasIndirectDependencies")).toBeVisible();
    await expect(page.locator("#hasMissingOrUnusedDependency")).toBeVisible();
    await expect(page.locator("#isDead")).toBeVisible();
    await expect(page.locator("#isOutdated")).toBeVisible();
    await expect(page.locator("#hasDuplicate")).toBeVisible();
  });

  test("renders keyboard shortcuts section with all hotkey inputs", async({ page }) => {
    await expect(page.locator(".shortcuts")).toBeVisible();
    expect(await page.locator(".hotkey").count()).toBe(8);
  });

  test("save button is disabled on initial render", async({ page }) => {
    await expect(page.locator(".save")).toContainClass("disabled");
  });

  test("save button becomes enabled after changing a setting", async({ page }) => {
    const themeSelector = page.locator("#theme_selector");
    const currentValue = await themeSelector.inputValue();
    const newValue = currentValue === "dark" ? "light" : "dark";

    await themeSelector.selectOption(newValue);

    await expect(page.locator(".save")).not.toContainClass("disabled");
  });
});
