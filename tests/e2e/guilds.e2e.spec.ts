import { test, expect } from "@playwright/test";
import { signIn, id, expectSafeError } from "./helpers";

test("owner sees only accessible guild workspaces and persisted roster summary", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/guilds");
  await expect(page.getByText("E2E Guild A")).toBeVisible();
  await expect(page.getByText("E2E Guild B")).toHaveCount(0);
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}`);
  await expect(page.getByText(/Guild roster/i)).toBeVisible();
  await expect(page.getByText(/characters/i).first()).toBeVisible();
  await expectSafeError(page);
});

test("guild creation form preserves independent content and realm concepts", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/guilds");
  await expect(page.getByRole("button", { name: /create guild/i })).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(4);
});
