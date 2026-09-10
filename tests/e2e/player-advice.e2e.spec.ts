import { test, expect } from "@playwright/test";
import { resetPlayerState, signIn } from "./helpers";

test.beforeEach(() => resetPlayerState());
test.afterEach(() => resetPlayerState());

test("supported Fury dashboard shows ranked advice and activity detail", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=aidy");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.waitForTimeout(500);
  await page.goto("/era/dashboard");
  await expect(page.getByText(/Never refreshed/)).toBeVisible();
  await expect(page.getByText(/realistic upgrade/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View upgrades" })).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh character" }).click();
  await expect(page.getByText(/Updated just now/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
  await expect(page.getByText(/realistic upgrade/).first()).toBeVisible();
  const action = page.getByRole("link", { name: "View upgrades" }).first();
  await expect(action).toBeVisible();
  await action.click();
  await expect(page.getByRole("heading", { name: /Recommended targets/ })).toBeVisible();
  await expect(page.getByText(/Realistic target|Aspirational target/).first()).toBeVisible();
  await page.goto("/era/dashboard");
});

test("switching to an unsupported mock character changes dashboard advice", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=aidy");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.waitForTimeout(500);
  await page.goto("/era/dashboard");
  await page.getByRole("button", { name: "Refresh character" }).click();
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
  await page.goto("/era/characters/connect?search=1&region=us&realmType=era&realm=whitemane&name=lyria");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.waitForTimeout(500);
  await page.goto("/era/dashboard");
  await page.getByRole("button", { name: "Switch to Lyria" }).click();
  await expect(page.getByText(/Personal gear recommendations for this specialization are coming later/).first()).toBeVisible();
  await page.getByRole("button", { name: "Switch to Aidy" }).click();
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
});
