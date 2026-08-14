import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { id, signIn } from "./helpers";

const routes = [
  "/auth/signin",
  "/era/guilds",
  `/era/guilds/${process.env.E2E_GUILD_A_ID}`,
  `/era/guilds/${process.env.E2E_GUILD_A_ID}/roster`,
  `/era/guilds/${process.env.E2E_GUILD_A_ID}/roster/import`,
  `/era/guilds/${process.env.E2E_GUILD_A_ID}/settings`,
  `/era/guilds/${process.env.E2E_GUILD_A_ID}/raids/${process.env.E2E_RAID_A_ID}`,
];

test.describe("automated accessibility acceptance", () => {
  test("public sign-in has no serious axe violations", async ({ page }) => {
    await page.goto("/auth/signin");
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((v) => v.impact === "critical" || v.impact === "serious"), JSON.stringify(result.violations)).toEqual([]);
  });

  test("authenticated guild surfaces have no serious axe violations", async ({ page }) => {
    await signIn(page);
    for (const route of routes.slice(1)) {
      await page.goto(route);
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations.filter((v) => v.impact === "critical" || v.impact === "serious"), `${route}: ${JSON.stringify(result.violations)}`).toEqual([]);
    }
  });

  test("mobile guild workspace keeps primary controls reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}`);
    await expect(page.getByRole("heading", { name: "Guild roster" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add roster character" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create event" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  });

  test("sign-in and guild navigation are keyboard operable", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(process.env.E2E_OWNER_EMAIL ?? "e2e-owner@prepull.test");
    await page.getByLabel("Password").fill(process.env.E2E_PASSWORD ?? "e2e-only-password-not-production");
    await page.getByRole("main").getByRole("button", { name: "Sign in" }).focus();
    await expect(page.getByRole("main").getByRole("button", { name: "Sign in" })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/era\/guilds/);
    await page.getByRole("link", { name: /Guild A/i }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/era\/guilds\//);
  });
});
