import { expect, test } from "@playwright/test";
import { addCharacter, e2eOrigin, resetPlayerState, signIn, submitServerAction } from "./helpers";

test.beforeEach(() => resetPlayerState());
test.afterEach(() => resetPlayerState());

async function save(page: Parameters<typeof addCharacter>[0], character: string, region = "eu", realm = "firemaw") {
  await page.goto(`/era/characters/connect?search=1&region=${region}&realmType=era&realm=${realm}&name=${character}`);
  await addCharacter(page);
  await page.goto("/era/onboarding");
  await expect(page.getByRole("heading", { name: character, exact: true })).toBeVisible();
}

test("builds, switches, and copies a persisted Fury session plan", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: e2eOrigin });
  await signIn(page);
  await save(page, "Aidy");
  await page.goto("/era/dashboard");
  await expect(page.getByText("Refresh your character before building a personalized session plan.")).toBeVisible();
  await submitServerAction(page, page.getByRole("button", { name: "Refresh character" }));
  await expect(page.getByText(/Updated just now|First refresh established your equipment baseline/).first()).toBeVisible();

  await page.getByText("90 minutes", { exact: true }).click();
  await page.getByText("Best progress", { exact: true }).click();
  await page.getByRole("button", { name: "Build my plan" }).click();
  await expect(page).toHaveURL(/duration=90m.*preference=best-progress|preference=best-progress.*duration=90m/);
  await expect(page.getByText("Tonight's plan")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Main goal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View activity details →" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Copy plan" }).click();
  await expect(page.getByRole("button", { name: "Plan copied" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("PrePull plan");

  await page.getByText("Dungeons", { exact: true }).click();
  await page.getByRole("button", { name: "Build my plan" }).click();
  await expect(page).toHaveURL(/preference=dungeons/);
  await expect(page.getByText("Tonight's plan")).toBeVisible();
});

test("blocks unsynced planning and keeps unsupported planning safe", async ({ page }) => {
  await signIn(page);
  await save(page, "Aidy");
  await page.goto("/era/dashboard");
  await expect(page.getByText("Refresh your character before building a personalized session plan.")).toBeVisible();

  await save(page, "Pyra", "us", "whitemane");
  await page.goto("/era/dashboard");
  await submitServerAction(page, page.getByRole("button", { name: "Switch to Pyra" }));
  await expect(page.getByRole("heading", { name: "Pyra", exact: true })).toBeVisible();
  await submitServerAction(page, page.getByRole("button", { name: "Refresh character" }));
  await expect(page.getByText(/Updated just now|First refresh established your equipment baseline/).first()).toBeVisible();
  await expect(page.getByText("Session planning based on gear upgrades isn't available for this specialization yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Build my plan" })).toHaveCount(0);
});

test("builds and copies a Frost Mage session plan", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: e2eOrigin });
  await signIn(page);
  await save(page, "Lyria", "us", "whitemane");
  await page.goto("/era/dashboard");
  await submitServerAction(page, page.getByRole("button", { name: "Refresh character" }));
  await expect(page.getByText("Frost Mage")).toBeVisible();
  await page.getByText("1 hour", { exact: true }).click();
  await page.getByText("Dungeons", { exact: true }).click();
  await page.getByRole("button", { name: "Build my plan" }).click();
  await expect(page.getByText("Tonight's plan")).toBeVisible();
  await page.getByRole("button", { name: "Copy plan" }).click();
  await expect(page.getByRole("button", { name: "Plan copied" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Lyria");
});

test("planner remains keyboard reachable on a narrow dashboard", async ({ page }) => {
  await signIn(page);
  await save(page, "Aidy");
  await page.goto("/era/dashboard");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
});
