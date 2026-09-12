import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { id, signIn } from "./helpers";

test("Era and TBC primary navigation preserve their route version", async ({ page }) => {
  await signIn(page);
  for (const version of ["era", "tbc"] as const) {
    await page.goto(`/${version}/dashboard`);
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Guilds" }).click();
    await expect(page).toHaveURL(new RegExp(`/${version}/guilds$`));
    await expect(page.getByRole("link", { name: "Guilds" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(new RegExp(`/${version}/profile$`));
  }
});

test("expansion selector preserves equivalent nested paths, query, and hash", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/dashboard?panel=planner#session");
  await page.getByRole("button", { name: "TBC", exact: true }).click();
  await expect(page).toHaveURL(/\/tbc\/dashboard\?panel=planner#session$/);
  await page.getByRole("button", { name: "ERA", exact: true }).click();
  await expect(page).toHaveURL(/\/era\/dashboard\?panel=planner#session$/);

  const nested = `/era/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}/prep?view=players#activity`;
  await page.goto(nested);
  await page.getByRole("button", { name: "TBC", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/tbc/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}/prep\\?view=players#activity$`));
});

test("TBC guild raid, readiness, Prep Board, and Profile flow never resets to Era", async ({ page }) => {
  await signIn(page, "e2e-officer@prepull.test");
  const raid = `/tbc/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}`;
  await page.goto(raid);
  await page.getByRole("link", { name: "View raid readiness" }).click();
  await expect(page).toHaveURL(new RegExp(`${raid}/readiness$`));
  await page.getByRole("link", { name: "View Prep Board" }).click();
  await expect(page).toHaveURL(new RegExp(`${raid}/prep$`));
  await page.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/tbc\/profile$/);
});

test("direct TBC links retain theme on refresh and mobile selector is keyboard and axe safe", async ({ page }) => {
  await signIn(page);
  await page.goto("/tbc/dashboard");
  await page.reload();
  const shell = page.locator("[data-content-version='tbc']");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("button", { name: "TBC", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await shell.evaluate((element) => getComputedStyle(element).getPropertyValue("--accent").trim())).toBe("#53e08b");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.getByText("Menu", { exact: true }).click();
  const era = page.getByRole("button", { name: "ERA", exact: true });
  await era.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/era\/dashboard$/);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), JSON.stringify(result.violations)).toEqual([]);
});

