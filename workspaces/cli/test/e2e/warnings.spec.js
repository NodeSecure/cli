// Import Third-party Dependencies
import { test, expect } from "@playwright/test";

// CONSTANTS
const kCleanConfig = {
  defaultPackageMenu: "info",
  ignore: { warnings: [], flags: [] },
  showFriendlyDependencies: false,
  theme: "dark",
  disableExternalRequests: true
};

test.describe("warnings page", () => {
  test.beforeEach(async({ page }) => {
    // Mock config route with clean config
    await page.route("**/config", async(route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(kCleanConfig)
        });

        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await page.waitForSelector(`[data-menu="network--view"].active`);
    await page.locator(`[data-menu="warnings--view"]`).click();
    await expect(page.locator("#warnings--view")).not.toContainClass("hidden");

    // Wait for the Lit component to render after secureDataSet is assigned
    await page
      .locator("warnings-view")
      .locator(".warnings-header")
      .waitFor();
  });

  test("shows 1 warning occurrence and 1 affected package in the header", async({ page }) => {
    const subtitle = page
      .locator("warnings-view")
      .locator(".warnings-subtitle");

    await expect(subtitle).toContainText("1");
  });

  test("shows the unsafe-regex kind card in the Warning section", async({ page }) => {
    const unsafeRegexKindName = page
      .locator("warnings-view")
      .locator(".kind-name")
      .filter({ hasText: "unsafe-regex" });
    await expect(unsafeRegexKindName).toBeVisible();
  });

  test("lists ms@2.1.3 in the unsafe-regex card", async({ page }) => {
    const unsafeRegexCard = page
      .locator("warnings-view")
      .locator(".kind-card")
      .filter({ has: page.locator(".kind-name", { hasText: "unsafe-regex" }) });
    const packageRow = unsafeRegexCard
      .locator(".pkg-row")
      .filter({ has: page.locator(".pkg-name", { hasText: /^ms/ }) });

    await expect(packageRow.locator(".pkg-name")).toContainText("ms");
    await expect(packageRow.locator(".version")).toContainText("@2.1.3");
  });

  test("Warning severity pill is non-zero, Critical is zero", async({ page }) => {
    const warningsView = page.locator("warnings-view");

    await expect(warningsView.locator(".severity-pill.warning")).not.toContainClass("zero");
    await expect(warningsView.locator(".severity-pill.critical")).toContainClass("zero");
  });
});
