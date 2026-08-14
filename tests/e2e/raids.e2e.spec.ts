import { test, expect } from "@playwright/test";
import { signIn, id, expectSafeError } from "./helpers";

test("assigned raid leader receives assignment controls", async ({ page }) => {
  await signIn(page, "e2e-assigned-leader@prepull.test");
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}`);
  await expect(page.getByRole("heading", { name: "Assignments", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /create assignment/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Group 1", exact: true })).toBeVisible();
  await expectSafeError(page);
});

test("unassigned raid leader may view but cannot manage assignments", async ({ page }) => {
  await signIn(page, "e2e-unassigned-leader@prepull.test");
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}`);
  await expect(page.getByRole("heading", { name: "Assignments", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /create assignment/i })).toHaveCount(0);
  await expectSafeError(page);
});

test("member sees own signup flow and raid readiness without officer mutation controls", async ({ page }) => {
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}`);
  await expect(page.getByRole("heading", { name: "Member signup" })).toBeVisible();
  await expect(page.getByRole("button", { name: /create assignment/i })).toHaveCount(0);
});
