// Import Third-party Dependencies
import { test, expect } from "@playwright/test";

// CONSTANTS
const kScorecard = {
  score: 7.5,
  checks: [
    {
      name: "Code-Review", score: 8, reason: "Changes are reviewed",
      documentation: { short: "Checks code reviews" }, details: ["Review detail"]
    },
    {
      name: "Maintained", score: -1, reason: "Not available",
      documentation: { short: "Checks maintenance" }, details: null
    }
  ]
};

async function openPackage(page, nodeId = 0) {
  await page.evaluate((id) => {
    window.dispatchEvent(new CustomEvent("tree-node-click", { detail: { nodeId: id } }));
  }, nodeId);
  await expect(page.locator("package-scorecard")).toBeAttached();
}

test.beforeEach(async({ page }) => {
  await page.route("**/config", async(route) => {
    const response = await route.fetch();
    const config = await response.json();
    await route.fulfill({ json: { ...config, disableExternalRequests: false } });
  });
  await page.route("**/scorecard/**", (route) => route.fulfill({ json: { data: kScorecard } }));
  await page.goto("/");
  await page.waitForFunction(() => window.networkNav);
});

test("renders the score, links and exclusive expandable checks", async({ page }) => {
  await openPackage(page);
  await expect(page.locator("#ossf-score")).toHaveText("7.5");
  await page.locator("#scorecard-menu").click();
  const panel = page.locator("package-scorecard");
  await expect(panel.locator(".score-value")).toHaveText("7.5/10");
  await expect(panel.locator(".visualizer a")).toHaveAttribute("href", /github.com\/debug-js\/debug$/);
  const checks = panel.locator(".check");
  await expect(checks.nth(1).locator(".score")).toHaveText("0/10");
  await expect(checks.nth(1)).toBeInViewport({ ratio: 1 });
  await checks.nth(0).click();
  await expect(checks.nth(0).locator(".detail")).toHaveText("Review detail");
  await expect(checks.nth(0).locator(".info")).toBeVisible();
  await checks.nth(1).click();
  await expect(checks.nth(0).locator(".info")).not.toBeVisible();
  await expect(checks.nth(1).locator(".info")).toBeVisible();
  await checks.nth(1).click();
  await expect(checks.nth(1).locator(".info")).not.toBeVisible();
  await page.locator('[data-menu="info"]').click();
  await expect(panel).not.toBeVisible();
});

test("hides the tab when the API has no scorecard", async({ page }) => {
  await page.route("**/scorecard/**", (route) => route.fulfill({ json: { data: null } }));
  const response = page.waitForResponse(/\/scorecard\//);
  await openPackage(page);
  await response;
  await expect(page.locator("#scorecard-menu")).not.toBeVisible();
  await expect(page.locator("package-scorecard .checks")).toHaveCount(0);
});

test("does not fetch scorecards when external requests are disabled", async({ page }) => {
  await page.evaluate(() => {
    window.settings.config.disableExternalRequests = true;
    window.dispatchEvent(new CustomEvent("tree-node-click", { detail: { nodeId: 0 } }));
  });
  await expect(page.locator("#package-info")).toHaveClass("slide-in");
  await expect(page.locator("package-scorecard")).toHaveCount(0);
  await expect(page.locator("#scorecard-menu")).not.toBeVisible();
});

test("a late response cannot overwrite the next package's score", async({ page }) => {
  let releaseFirst;
  const firstResponse = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let first = true;
  await page.route("**/scorecard/**", async(route) => {
    if (first) {
      first = false;
      await firstResponse;
      await route.fulfill({ json: { data: { ...kScorecard, score: 1 } } });
    }
    else {
      await route.fulfill({ json: { data: kScorecard } });
    }
  });
  const firstRequest = page.waitForRequest(/\/scorecard\//);
  await openPackage(page);
  await firstRequest;
  await openPackage(page, 1);
  await expect(page.locator("#ossf-score")).toHaveText("7.5");
  const response = page.waitForResponse(/\/scorecard\//);
  releaseFirst();
  await response;
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await expect(page.locator("#ossf-score")).toHaveText("7.5");
});
