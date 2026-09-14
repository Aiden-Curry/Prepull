import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getCalendarEvents } from "../../lib/calendar/registry";
import { calendarEventStatus, filterCalendarEvents } from "../../lib/calendar/service";
import type { CalendarCategoryFilter, CalendarDisplayRegion } from "../../lib/calendar/types";
import type { ContentVersion } from "../../lib/types";
import { signIn } from "./helpers";

function eligibleEventTitles(version: ContentVersion, region: CalendarDisplayRegion, category: CalendarCategoryFilter, now: Date) {
  return filterCalendarEvents(getCalendarEvents(version), { version, region, category })
    .filter((event) => calendarEventStatus(event, now, region) !== "ended")
    .map((event) => event.title);
}

async function expectEligibleEvent(page: Page, titles: string[]) {
  if (titles.length) await expect(page.getByText(titles[0], { exact: true }).first()).toBeVisible();
  else await expect(page.getByText("No verified upcoming events are currently listed for this region and filter.")).toBeVisible();
}

test("public Era calendar supports regions, filters, provenance, and version switching", async ({ page }) => {
  const now = new Date();
  await page.goto("/era/calendar?region=eu");
  await expect(page.locator("[data-content-version='era']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Game Calendar" })).toBeVisible();
  await expectEligibleEvent(page, eligibleEventTitles("era", "eu", "all", now));
  if (calendarEventStatus(getCalendarEvents("era").find((event) => event.id === "arathi-basin-era-eu-2026-09")!, now, "eu") === "ended") {
    await expect(page.getByText("Arathi Basin Bonus Weekend", { exact: true })).toHaveCount(0);
  }
  await page.getByText("Source and verification").first().click();
  await expect(page.getByRole("link", { name: /View source/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Holidays" }).click();
  await expectEligibleEvent(page, eligibleEventTitles("era", "eu", "holidays", now));
  await page.getByRole("link", { name: "US" }).click();
  await expect(page).toHaveURL(/\/era\/calendar\?region=us$/);
  await page.getByRole("button", { name: "TBC", exact: true }).click();
  await expect(page).toHaveURL(/\/tbc\/calendar\?region=us$/);
  await expect(page.locator("[data-content-version='tbc']")).toBeVisible();
  await expectEligibleEvent(page, eligibleEventTitles("tbc", "us", "holidays", now));
  await page.getByRole("button", { name: "Darkmoon Faire" }).click();
  await expectEligibleEvent(page, eligibleEventTitles("tbc", "us", "darkmoon-faire", now));
});

test("direct TBC calendar is public, mobile, keyboard, and axe safe", async ({ page }) => {
  await page.goto("/tbc/calendar?region=eu");
  await expect(page).toHaveURL(/\/tbc\/calendar\?region=eu$/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  const all = page.getByRole("button", { name: "All", exact: true }); await all.focus(); await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Battlegrounds" })).toBeFocused();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), JSON.stringify(axe.violations)).toEqual([]);
});

test("dashboard previews keep Era and TBC events isolated", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/dashboard");
  await expect(page.getByRole("heading", { name: "Coming Up in Era" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Calendar" })).toHaveAttribute("href", "/era/calendar?region=eu");
  await expect(page.getByText("Brewfest", { exact: true })).toHaveCount(0);
  await page.goto("/tbc/dashboard");
  await expect(page.getByRole("heading", { name: "Coming Up in TBC" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Calendar" })).toHaveAttribute("href", "/tbc/calendar?region=eu");
  await expect(page.getByText("Arathi Basin Bonus Weekend", { exact: true })).toHaveCount(0);
});
