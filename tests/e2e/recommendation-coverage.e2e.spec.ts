import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addCharacter, resetPlayerState, signIn, submitServerAction } from "./helpers";

test.beforeEach(() => resetPlayerState());
test.afterEach(() => resetPlayerState());

const secondWave = [
  { name: "Rivyn", region: "eu", realm: "firemaw", label: "Combat Rogue" },
  { name: "Talan", region: "us", realm: "whitemane", label: "Marksmanship Hunter" },
  { name: "Elowen", region: "eu", realm: "firemaw", label: "Holy Priest" },
] as const;

async function save(page: Parameters<typeof addCharacter>[0], character: { name: string; region: string; realm: string }) {
  await page.goto(`/era/characters/connect?search=1&region=${character.region}&realmType=era&realm=${character.realm}&name=${character.name}`);
  await addCharacter(page);
  await page.goto("/era/onboarding");
  await expect(page.getByRole("heading", { name: character.name, exact: true })).toBeVisible();
}

for (const character of secondWave) test(`${character.label} refreshes into advice and Session Planner`, async ({ page }) => {
  await signIn(page);
  await save(page, character);
  await page.goto("/era/dashboard");
  await expect(page.getByText(/Never refreshed/)).toBeVisible();
  await submitServerAction(page, page.getByRole("button", { name: "Refresh character" }));
  await expect(page.getByText(character.label)).toBeVisible();
  await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View upgrades" }).first()).toBeVisible();
  await page.getByText("1 hour", { exact: true }).click();
  await page.getByText("Best progress", { exact: true }).click();
  await page.getByRole("button", { name: "Build my plan" }).click();
  await expect(page.getByText("Tonight's plan")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Main goal" })).toBeVisible();
});

test("switching across supported specs and an unsupported spec never leaves stale advice", async ({ page }) => {
  await signIn(page);
  const characters = [
    { name: "Aidy", region: "eu", realm: "firemaw", label: "Fury Warrior" },
    { name: "Lyria", region: "us", realm: "whitemane", label: "Frost Mage" },
    ...secondWave,
    { name: "Pyra", region: "us", realm: "whitemane", label: "unsupported" },
  ];
  for (const character of characters) await save(page, character);
  await page.goto("/era/dashboard");
  for (const character of characters) {
    if (character.name !== "Aidy") {
      await submitServerAction(page, page.getByRole("button", { name: `Switch to ${character.name}` }));
      await expect(page.getByRole("heading", { name: character.name, exact: true })).toBeVisible();
    }
    await submitServerAction(page, page.getByRole("button", { name: "Refresh character" }));
    if (character.label === "unsupported") {
      await expect(page.getByText("Personal gear recommendations for this specialization are coming later.").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Build my plan" })).toHaveCount(0);
    } else await expect(page.getByText(character.label)).toBeVisible();
  }
  await submitServerAction(page, page.getByRole("button", { name: "Switch to Aidy" }));
  await expect(page.getByRole("heading", { name: "Aidy", exact: true })).toBeVisible();
  await expect(page.getByText("Fury Warrior")).toBeVisible();
});

test("coverage page is registry-driven mobile keyboard and axe safe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/era/coverage");
  await expect(page.getByRole("heading", { name: "Know what PrePull supports." })).toBeVisible();
  for (const label of ["Fury Warrior", "Frost Mage", "Combat Rogue", "Marksmanship Hunter", "Holy Priest"]) await expect(page.getByRole("heading", { name: label })).toBeVisible();
  await expect(page.getByText("Coming later").first()).toBeVisible();
  await expect(page.getByText("Pre-Raid").first()).toBeVisible();
  await expect(page.getByText("Phase 1").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), JSON.stringify(result.violations)).toEqual([]);
});
