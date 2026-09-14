import { test, expect } from "@playwright/test";
import { addCharacter, resetPlayerState, signIn } from "./helpers";

test.beforeEach(() => resetPlayerState());
test.afterEach(() => resetPlayerState());

test("first character refresh establishes a baseline and keeps advice visible", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=freshfury");
  await addCharacter(page);
  await page.goto("/era/dashboard");
  await expect(page.getByText(/Updated just now|First refresh established your equipment baseline/).first()).toBeVisible();
  await expect(page.getByText(/What should I do next\?/)).toBeVisible();
});

test("Anniversary refresh remains explicitly unsupported", async ({ page }) => {
  await signIn(page);
  await page.goto("/tbc/characters/connect?search=1&region=eu&realmType=anniversary&realm=spineshatter&name=aidy");
  await expect(page.getByRole("heading", { name: "Aidy" })).toBeVisible();
  await expect(page.getByText(/cannot sync or recommend for Anniversary/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to my characters" })).toHaveCount(0);
});
