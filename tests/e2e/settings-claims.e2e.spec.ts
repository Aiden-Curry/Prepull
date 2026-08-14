import { test, expect } from "@playwright/test";
import { signIn, id, expectSafeError } from "./helpers";

test("owner settings expose safe claim methodology and permission controls", async ({ page }) => {
  await signIn(page);
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/settings`);
  await expect(page.getByText("Officer verified")).toBeVisible();
  await expect(page.getByText("Battle.net verified")).toHaveCount(0);
  await expect(page.getByText(/Roles and permissions/i)).toBeVisible();
  await expectSafeError(page);
});

test("member settings expose claim submission but not officer controls", async ({ page }) => {
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/settings`);
  await expect(page.getByText(/Roles and permissions/i)).toHaveCount(0);
  await expect(page.getByText("Battle.net verified")).toHaveCount(0);
});
