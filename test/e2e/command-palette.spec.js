// Import Third-party Dependencies
import { test, expect } from "@playwright/test";

test.describe("[command-palette] presets and actions", () => {
  let i18n;
  let initialConfig;

  test.beforeAll(async({ request }) => {
    const response = await request.get("/config");
    initialConfig = await response.json();
  });

  test.afterAll(async({ request }) => {
    await request.put("/config", { data: initialConfig });
  });

  test.beforeEach(async({ page }) => {
    await page.goto("/");
    await page.waitForSelector(`[data-menu="network--view"].active`);

    i18n = await page.evaluate(() => {
      const lang = document.getElementById("lang").dataset.lang;
      const activeLang = lang in window.i18n ? lang : "english";

      return window.i18n[activeLang].search_command;
    });

    await page.locator(`[data-menu="network--view"].active`).click();
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

  test("renders all four action buttons", async({ page }) => {
    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    await expect(actionsSection.locator(".range-preset")).toHaveCount(4);
  });

  test("clicking a preset adds a chip and hides the presets section", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_has_vulnerabilities }).click();

    await expect(page.locator("search-chip")).toBeVisible();
    await expect(page.locator(".section-title").filter({ hasText: i18n.section_presets })).not.toBeVisible();
  });

  test("shows contextual empty message for has-vulnerabilities preset", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_has_vulnerabilities }).click();

    await expect(page.locator(".dialog .empty-state")).toHaveText(i18n.preset_empty_has_vulnerabilities);
  });

  test("shows contextual empty message for deprecated preset", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_deprecated }).click();

    await expect(page.locator(".dialog .empty-state")).toHaveText(i18n.preset_empty_deprecated);
  });

  test("shows generic empty message when a manual filter yields no results", async({ page }) => {
    await page.locator("#cmd-input").fill("flag:hasBannedFile");
    await page.keyboard.press("Enter");

    await expect(page.locator(".dialog .empty-state")).toHaveText(i18n.empty_after_filter);
  });

  test("clicking the theme action closes the palette and toggles the theme", async({ page }) => {
    const initialTheme = await page.evaluate(() => window.settings.config.theme);
    const expectedTheme = initialTheme === "dark" ? "light" : "dark";

    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    const toggleLabel = i18n[`action_toggle_theme_to_${expectedTheme}`];
    await actionsSection.locator(".range-preset").filter({ hasText: toggleLabel }).click();

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

  test("theme toggle from command palette persists after page reload", async({ page }) => {
    const initialTheme = await page.evaluate(() => window.settings.config.theme);
    const expectedTheme = initialTheme === "dark" ? "light" : "dark";

    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    const toggleLabel = i18n[`action_toggle_theme_to_${expectedTheme}`];
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes("/config") && resp.request().method() === "PUT"),
      actionsSection.locator(".range-preset").filter({ hasText: toggleLabel }).click()
    ]);
    expect(response.status()).toBe(204);

    await page.reload();
    await page.waitForSelector(`[data-menu="network--view"].active`);

    const themeAfterReload = await page.evaluate(() => window.settings.config.theme);
    expect(themeAfterReload).toBe(expectedTheme);
  });

  test("pressing Escape closes the palette", async({ page }) => {
    await page.keyboard.press("Escape");

    await expect(page.locator(".backdrop")).not.toBeVisible();
  });

  test("actions section remains visible after a filter chip is applied", async({ page }) => {
    await page.locator(".range-preset").filter({ hasText: i18n.preset_deprecated }).click();

    await expect(page.locator(".section").filter({ hasText: i18n.section_actions })).toBeVisible();
  });

  test("clicking reset view closes the palette", async({ page }) => {
    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    await actionsSection.locator(".range-preset").filter({ hasText: i18n.action_reset_view }).click();

    await expect(page.locator(".backdrop")).not.toBeVisible();
  });

  test("Alt+R triggers reset view and closes the palette", async({ page }) => {
    await page.keyboard.press("Alt+r");

    await expect(page.locator(".backdrop")).not.toBeVisible();
  });

  test("clicking copy packages closes the palette and writes specs to clipboard", async({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    await actionsSection.locator(".range-preset").filter({ hasText: i18n.action_copy_packages }).click();

    await expect(page.locator(".backdrop")).not.toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.length).toBeGreaterThan(0);
    expect(clipboardText).toContain("@");
  });

  test("Alt+C triggers copy packages and closes the palette", async({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.keyboard.press("Alt+c");

    await expect(page.locator(".backdrop")).not.toBeVisible();
  });

  test("clicking export payload closes the palette and triggers a download", async({ page }) => {
    const actionsSection = page.locator(".section").filter({ hasText: i18n.section_actions });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      actionsSection.locator(".range-preset").filter({ hasText: i18n.action_export_payload }).click()
    ]);

    await expect(page.locator(".backdrop")).not.toBeVisible();
    expect(download.suggestedFilename()).toBe("nsecure-result.json");
  });

  test("Alt+E triggers export payload and closes the palette", async({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.keyboard.press("Alt+e")
    ]);

    await expect(page.locator(".backdrop")).not.toBeVisible();
    expect(download.suggestedFilename()).toBe("nsecure-result.json");
  });
});

test.describe("[command-palette] ignore flags and warnings", () => {
  let i18n;

  test.beforeEach(async({ page }) => {
    await page.goto("/");
    await page.waitForSelector(`[data-menu="network--view"].active`);

    i18n = await page.evaluate(() => {
      const lang = document.getElementById("lang").dataset.lang;
      const activeLang = lang in window.i18n ? lang : "english";

      return window.i18n[activeLang].search_command;
    });

    await page.locator(`[data-menu="network--view"].active`).click();
    await page.keyboard.press("Control+k");

    await expect(page.locator(".backdrop")).toBeVisible();
  });

  test("renders the ignore flags section", async({ page }) => {
    await expect(page.locator(".section").filter({ hasText: i18n.section_ignore_flags })).toBeVisible();
  });

  test("renders the ignore warnings section", async({ page }) => {
    await expect(page.locator(".section").filter({ hasText: i18n.section_ignore_warnings })).toBeVisible();
  });

  test("renders all six ignorable flag chips", async({ page }) => {
    const ignoreFlagsSection = page.locator(".section").filter({ hasText: i18n.section_ignore_flags });

    await expect(ignoreFlagsSection.locator(".flag-chip")).toHaveCount(6);
  });

  test("renders at least one warning chip", async({ page }) => {
    const ignoreWarningsSection = page.locator(".section").filter({ hasText: i18n.section_ignore_warnings });

    expect(await ignoreWarningsSection.locator(".flag-chip").count()).toBeGreaterThan(0);
  });

  test("clicking a flag chip marks it as ignored", async({ page }) => {
    const ignoreFlagsSection = page.locator(".section").filter({ hasText: i18n.section_ignore_flags });
    const chip = ignoreFlagsSection.locator(".flag-chip[title='isOutdated']");

    const isInitiallyIgnored = await page.evaluate(
      () => window.settings.config.ignore.flags.has("isOutdated")
    );
    if (isInitiallyIgnored) {
      await chip.click();
      await expect(chip).not.toContainClass("flag-active");
    }

    await chip.click();

    await expect(chip).toContainClass("flag-active");
    const ignoredFlags = await page.evaluate(() => [...window.settings.config.ignore.flags]);
    expect(ignoredFlags).toContain("isOutdated");
  });

  test("clicking an active flag chip removes it from ignored", async({ page }) => {
    const ignoreFlagsSection = page.locator(".section").filter({ hasText: i18n.section_ignore_flags });
    const chip = ignoreFlagsSection.locator(".flag-chip[title='isOutdated']");

    const isInitiallyIgnored = await page.evaluate(
      () => window.settings.config.ignore.flags.has("isOutdated")
    );
    if (!isInitiallyIgnored) {
      await chip.click();
      await expect(chip).toContainClass("flag-active");
    }

    await chip.click();

    await expect(chip).not.toContainClass("flag-active");
    const ignoredFlags = await page.evaluate(() => [...window.settings.config.ignore.flags]);
    expect(ignoredFlags).not.toContain("isOutdated");
  });

  test("clicking a warning chip marks it as ignored", async({ page }) => {
    const ignoreWarningsSection = page.locator(".section").filter({ hasText: i18n.section_ignore_warnings });
    const chip = ignoreWarningsSection.locator(".flag-chip").first();
    const warningValue = await chip.getAttribute("title");

    const isInitiallyIgnored = await page.evaluate(
      (id) => window.settings.config.ignore.warnings.has(id),
      warningValue
    );
    if (isInitiallyIgnored) {
      await chip.click();
      await expect(chip).not.toContainClass("flag-active");
    }

    await chip.click();

    await expect(chip).toContainClass("flag-active");
    const ignoredWarnings = await page.evaluate(() => [...window.settings.config.ignore.warnings]);
    expect(ignoredWarnings).toContain(warningValue);
  });

  test("ignore sections are hidden when a filter is active", async({ page }) => {
    await page.locator("#cmd-input").fill("flag:");

    await expect(page.locator(".section").filter({ hasText: i18n.section_ignore_flags })).not.toBeVisible();
    await expect(page.locator(".section").filter({ hasText: i18n.section_ignore_warnings })).not.toBeVisible();
  });
});
