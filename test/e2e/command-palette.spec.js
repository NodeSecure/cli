// Import Third-party Dependencies
import { test, expect } from "@playwright/test";

test.describe("[command-palette] presets and actions", () => {
  let i18n;

  test.beforeEach(async({ page }) => {
    await page.goto("/");
    await page.waitForSelector(`[data-menu="network--view"].active`);

    i18n = await page.evaluate(() => {
      const lang = document.getElementById("lang").dataset.lang;
      const activeLang = lang in window.i18n ? lang : "english";

      return window.i18n[activeLang].search_command;
    });

    await page.locator("body").click();
    await page.keyboard.press("Control+k");

    await expect(page.locator(".backdrop")).toBeVisible();
  });

  test("shows the Quick filters section on open", async({ page }) => {
    await expect(page.locator(".section-title").filter({ hasText: i18n.section_presets })).toBeVisible();
  });

  test("renders all five preset buttons", async({ page }) => {
    const presetsSection = page.locator(".section").filter({ hasText: i18n.section_presets });
    await expect(presetsSection.locator(".range-preset")).toHaveCount(5);
  });

  test("renders the theme toggle action button", async({ page }) => {
    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    await expect(actionsSection.locator(".range-preset")).toHaveCount(1);
  });

  test("clicking a preset adds a chip and hides the presets section", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_has_vulnerabilities }).click();

    await expect(page.locator("search-chip")).toBeVisible();
    await expect(page.locator(".section-title").filter({ hasText: i18n.section_presets })).not.toBeVisible();
  });

  test("shows contextual empty message for has-vulnerabilities preset", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_has_vulnerabilities }).click();

    await expect(page.locator(".empty-state")).toHaveText(i18n.preset_empty_has_vulnerabilities);
  });

  test("shows contextual empty message for deprecated preset", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_deprecated }).click();

    await expect(page.locator(".empty-state")).toHaveText(i18n.preset_empty_deprecated);
  });

  test("shows generic empty message when a manual filter yields no results", async({ page }) => {
    await page.locator("#cmd-input").fill("flag:hasBannedFile");
    await page.keyboard.press("Enter");

    await expect(page.locator(".empty-state")).toHaveText(i18n.empty_after_filter);
  });

  test("clicking the theme action closes the palette and toggles the theme", async({ page }) => {
    const initialTheme = await page.evaluate(() => window.settings.config.theme);
    const expectedTheme = initialTheme === "dark" ? "light" : "dark";

    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    await actionsSection.locator(".range-preset").click();

    await expect(page.locator(".backdrop")).not.toBeVisible();
    const newTheme = await page.evaluate(() => window.settings.config.theme);
    expect(newTheme).toBe(expectedTheme);
  });

  test("Alt+T triggers the theme toggle and closes the palette", async({ page }) => {
    const initialTheme = await page.evaluate(() => window.settings.config.theme);
    const expectedTheme = initialTheme === "dark" ? "light" : "dark";

    await page.keyboard.press("Alt+t");

    await expect(page.locator(".backdrop")).not.toBeVisible();
    const newTheme = await page.evaluate(() => window.settings.config.theme);
    expect(newTheme).toBe(expectedTheme);
  });

  test("pressing Escape closes the palette", async({ page }) => {
    await page.keyboard.press("Escape");

    await expect(page.locator(".backdrop")).not.toBeVisible();
  });
});
