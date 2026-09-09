import { test, expect } from "@playwright/test";
import { signIn, expectSafeError } from "./helpers";

test("onboarding and dashboard redirect anonymously", async ({ page }) => {
  for (const path of ["/era/onboarding", "/era/dashboard", "/era/characters/connect"]) {
    const response = await page.request.get(path, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    expect(response.headers().location).toMatch(/^\/auth\/signin/);
  }
});

test("authenticated player can search the deterministic character provider", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect");
  await page.getByLabel("Region").selectOption("eu");
  await page.getByLabel("Realm ecosystem").selectOption("era");
  await page.getByRole("textbox", { name: "Realm" }).fill("Firemaw");
  await page.getByLabel("Character name").fill("Aidy");
  await page.getByRole("button", { name: "Search character" }).click();
  await expect(page.getByRole("heading", { name: "Aidy" })).toBeVisible();
  await expect(page.getByText("Saving a character does not verify ownership.")).toBeVisible();
  await expectSafeError(page);
});

test("authenticated player can save, choose, and remove a character", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=aidy");
  await page.getByRole("button", { name: "Add to PrePull" }).click();
  await page.waitForTimeout(500);
  await page.goto("/era/onboarding");
  await expect(page.getByRole("heading", { name: "Aidy" })).toBeVisible();
  await expect(page.getByText("Primary").first()).toBeVisible();
  await page.goto("/era/dashboard");
  await expect(page.getByText("Aidy").first()).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Choose a character to make this home yours.")).toBeVisible();
});

test("anniversary search preserves its unsupported state", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=anniversary&realm=firemaw&name=aidy");
  await expect(page.getByText(/Anniversary character profiles aren't available yet|Character not found/)).toBeVisible();
  await expectSafeError(page);
});

test("dashboard has keyboard-reachable character controls on mobile", async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/era/dashboard");
  await expect(page.getByRole("link", { name: "Add character" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
