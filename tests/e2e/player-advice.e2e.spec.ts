import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test("supported Fury dashboard shows ranked advice and activity detail", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=freshfury");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.goto("/era/dashboard");
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
  await expect(page.getByText(/realistic upgrade/).first()).toBeVisible();
  const action = page.getByRole("link", { name: "View upgrades" }).first();
  await expect(action).toBeVisible();
  await action.click();
  await expect(page.getByRole("heading", { name: /Recommended targets/ })).toBeVisible();
  await expect(page.getByText(/Realistic target|Aspirational target/).first()).toBeVisible();
  await page.goto("/era/dashboard");
  await page.getByRole("button", { name: /Remove/ }).last().click();
});

test("switching to an unsupported mock character changes dashboard advice", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=aidy");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.goto("/era/characters/connect?search=1&region=us&realmType=era&realm=whitemane&name=lyria");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.goto("/era/dashboard");
  await page.getByRole("button", { name: "Switch to Lyria" }).click();
  await expect(page.getByText(/Personal gear recommendations for this specialization are coming later/).first()).toBeVisible();
  await page.getByRole("button", { name: "Switch to Aidy" }).click();
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
  await page.getByRole("button", { name: /Remove/ }).first().click();
  await page.getByRole("button", { name: /Remove/ }).first().click();
});
