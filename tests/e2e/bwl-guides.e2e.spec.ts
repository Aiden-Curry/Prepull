import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { raidProgressionEncounters } from "../../lib/guides/registry";

const path = "/era/guides/raids/blackwing-lair";
test("BWL discovery, eight registry cards and no unpublished boss links", async ({ page, request }) => {
  for (const index of ["/era/guides", "/era/guides/raids"]) {
    expect((await page.goto(index))?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Blackwing Lair", exact: true })).toBeVisible();
    await expect(page.locator(`a[href="${path}"]`)).toHaveCount(1);
  }
  expect((await page.goto(path))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blackwing Lair");
  const cards = page.getByTestId("boss-cards");
  await expect(cards.locator("li")).toHaveCount(8);
  expect(await cards.locator("li").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-progression-encounter-id"))))).toEqual(raidProgressionEncounters("era", 2002).map(boss => boss.id));
  await expect(cards.getByRole("link")).toHaveCount(0);
  await expect(cards.getByText("Boss guide not yet published.", { exact: true })).toHaveCount(8);
  await expect(cards).not.toContainText("Ebonroc / Flamegor");
  for (const boss of raidProgressionEncounters("era", 2002)) {
    const slug = boss.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    expect((await request.get(`${path}/${slug}`)).status()).toBe(404);
  }
});

test("BWL SEO, breadcrumbs, sections and TBC separation", async ({ page, request }) => {
  await page.goto(path);
  await expect(page).toHaveTitle(/Blackwing Lair.*Classic Era/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
  await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("Raids");
  for (const id of ["overview", "entry", "preparation", "mechanics", "roles", "consumables", "trash", "mistakes", "boss-order", "sources"]) await expect(page.locator(`#${id}`)).toBeVisible();
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(path);
  expect(xml).not.toContain(`${path}/`);
  expect((await page.goto("/tbc/guides/raids/blackwing-lair"))?.status()).toBe(404);
  await page.goto("/tbc/guides");
  await expect(page.getByRole("main")).toContainText("TBC guides are coming later");
  await expect(page.locator(`a[href="${path}"]`)).toHaveCount(0);
});

for (const width of [1440, 390]) test(`BWL ${width}px layout and accessibility`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await expect(page.getByTestId("boss-cards").locator("li")).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(issue => ["serious", "critical"].includes(issue.impact ?? ""))).toEqual([]);
});
