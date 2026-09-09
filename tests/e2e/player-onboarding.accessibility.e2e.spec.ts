import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./helpers";

test("player onboarding surfaces have no serious or critical axe violations", async ({ page }) => {
  await signIn(page);
  for (const route of ["/era/onboarding", "/era/characters/connect", "/era/dashboard", "/era/profile"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), `${route}: ${JSON.stringify(result.violations)}`).toEqual([]);
  }
});

test("player dashboard remains usable on mobile without horizontal scrolling", async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/era/dashboard");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await expect(page.getByRole("link", { name: "Add character" })).toBeVisible();
});
