import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { base, deleteSyntheticAccount, expectSafeError, resetPlayerState, signIn } from "./helpers";

const eraEmail = "era@public-beta-e2e.prepull.test";
const tbcEmail = "tbc@public-beta-e2e.prepull.test";
const password = "correct horse battery staple";

async function register(page: Parameters<typeof signIn>[0], version: "era" | "tbc", email: string) {
  await page.goto(`/${version}`);
  await page.getByRole("link", { name: "Create account" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/auth/signup\\?callbackUrl=%2F${version}`));
  await page.getByLabel("Email").fill(email.toUpperCase());
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(`**/${version}/characters/connect`);
}

async function findAndSaveAidy(page: Parameters<typeof signIn>[0], version: "era" | "tbc") {
  await page.getByLabel("Region").selectOption("eu"); await page.getByLabel("Realm ecosystem").selectOption("era");
  await page.getByRole("textbox", { name: "Realm" }).fill("Firemaw"); await page.getByLabel("Character name").fill("Aidy");
  await page.getByRole("button", { name: "Search character" }).click();
  await expect(page.getByRole("heading", { name: "Aidy" })).toBeVisible(); await expect(page.getByText(/Level 60 Orc Warrior/)).toBeVisible();
  await page.getByRole("button", { name: "Add to my characters" }).click(); await page.waitForURL(`**/${version}/dashboard`);
  await expect(page.getByText(/Updated just now/)).toBeVisible();
}

test.beforeEach(async () => { await deleteSyntheticAccount(eraEmail); await deleteSyntheticAccount(tbcEmail); });
test.afterEach(async () => { await deleteSyntheticAccount(eraEmail); await deleteSyntheticAccount(tbcEmail); await resetPlayerState(); });

test("new Era visitor registers, auto-signs in, finds, saves, syncs, and reaches advice", async ({ page }) => {
  await register(page, "era", eraEmail); await findAndSaveAidy(page, "era");
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
});

test("new TBC visitor preserves version through registration, finder, save, and dashboard", async ({ page }) => {
  await register(page, "tbc", tbcEmail); await findAndSaveAidy(page, "tbc");
  await expect(page).toHaveURL(/\/tbc\/dashboard/); await expect(page.locator("[data-content-version='tbc']")).toBeVisible();
});

test("signup and finder failures are safe and Anniversary remains unsupported", async ({ page }) => {
  await page.goto("/auth/signup?callbackUrl=%2Fera%2Fcharacters%2Fconnect");
  await page.getByLabel("Email").fill("invalid"); await page.getByLabel("Password", { exact: true }).fill("short"); await page.getByLabel("Confirm password").fill("different");
  await page.getByRole("main").getByRole("button", { name: "Create account" }).click(); await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await page.getByLabel("Email").fill(base.email); await page.getByLabel("Password", { exact: true }).fill(password); await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Create account" }).click(); await expect(page.getByText(/account with that email already exists/i)).toBeVisible();
  await signIn(page); await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=wrong&name=wrong"); await expect(page.getByText(/couldn't find that character/i)).toBeVisible();
  await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=providerdown"); await expect(page.getByText(/temporarily unavailable/i)).toBeVisible(); await expectSafeError(page); await expect(page.locator("body")).not.toContainText("Synthetic provider internals");
  await page.goto("/tbc/characters/connect?search=1&region=eu&realmType=anniversary&realm=spineshatter&name=aidy"); await expect(page.getByText(/cannot sync or recommend for Anniversary/)).toBeVisible(); await expect(page.getByRole("button", { name: "Add to my characters" })).toHaveCount(0);
});
