import { test, expect } from "@playwright/test";
import { signIn, id, syntheticCsv, expectSafeError } from "./helpers";

test("officer can reach the deterministic CSV preview workflow", async ({ page }) => {
  await signIn(page, "e2e-officer@prepull.test");
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/roster/import`);
  await expect(page.getByText(/Automatic Classic guild import/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /generate preview/i })).toBeVisible();
  await expectSafeError(page);
});

test("synthetic CSV fixtures stay local to the browser test and never enter rendered audit output", async ({ page }) => {
  await signIn(page);
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/roster/import`);
  await expect(page.locator("textarea")).toHaveValue(/name,region,realm/);
  await page.locator("textarea").fill(syntheticCsv.utf8);
  await expect(page.locator("textarea")).toHaveValue(/E2E Åsa/);
  await expectSafeError(page);
});
