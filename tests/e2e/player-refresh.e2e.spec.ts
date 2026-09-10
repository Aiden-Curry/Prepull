import { test, expect } from "@playwright/test";
import { addCharacter, resetPlayerState, signIn } from "./helpers";

test.beforeEach(() => resetPlayerState());
test.afterEach(() => resetPlayerState());

test("first character refresh establishes a baseline and keeps advice visible", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=freshfury");
  await addCharacter(page);
  await page.goto("/era/dashboard");
  await expect(page.getByText(/Never refreshed/)).toBeVisible();
  await page.getByRole("button", { name: "Refresh character" }).click();
  await expect(page.getByText(/Updated just now|First refresh established your equipment baseline/).first()).toBeVisible();
  await expect(page.getByText(/What should I do next\?/)).toBeVisible();
});

test("Anniversary refresh remains explicitly unsupported", async ({ page }) => {
  await signIn(page);
  await page.goto("/tbc/characters/connect?search=1&region=eu&realmType=anniversary&realm=spineshatter&name=aidy");
  await addCharacter(page);
  await page.goto("/tbc/onboarding");
  await expect(page.getByRole("heading", { name: "Aidy" }).last()).toBeVisible();
  await page.goto("/tbc/dashboard");
  await page.getByRole("button", { name: "Refresh character" }).click();
  await expect(page.getByText(/Live Anniversary character profiles aren't available yet/).first()).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
});
