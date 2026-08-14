import { test, expect } from "@playwright/test";
import { signIn, id, expectSafeError } from "./helpers";

test("guild and raid rendered output contains no secret or raw-error material", async ({ page }) => {
  await signIn(page);
  const routes = [
    `/era/guilds/${id("E2E_GUILD_A_ID")}/settings`,
    `/era/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}`,
    `/era/guilds/${id("E2E_GUILD_A_ID")}/roster`,
    `/era/guilds/${id("E2E_GUILD_A_ID")}/roster/import`
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expectSafeError(page);
  }
});

test("missing guild and raid responses remain generic", async ({ page }) => {
  await signIn(page);
  for (const route of [
    "/era/guilds/00000000-0000-0000-0000-000000000000",
    `/era/guilds/${id("E2E_GUILD_A_ID")}/raids/00000000-0000-0000-0000-000000000000`
  ]) {
    const response = await page.goto(route);
    expect(response?.status() ?? 0).toBeGreaterThanOrEqual(200);
    await expectSafeError(page);
  }
});

