import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";
import { guideHref, publishedGuides, moltenCoreEncounters } from "../../lib/guides/registry";
import { resolveGuideGear } from "../../lib/guides/gear";
import { logsCacheKey } from "../../lib/warcraft-logs/identity";
import { addCharacter, resetPlayerState, signIn } from "./helpers";

const fury = "/era/guides/classes/warrior/fury";
const mc = "/era/guides/raids/molten-core";
test("published discovery, filtering, indices and direct unpublished routes", async ({ page }) => {
  await page.goto("/era/guides");
  await expect(page.getByRole("heading", { name: "Fury Warrior", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Molten Core", exact: true })).toBeVisible();
  await page.getByLabel("Find a guide").fill("garr");
  await expect(page.getByRole("heading", { name: "Garr", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 published guides");
  for (const path of ["/era/guides/classes", "/era/guides/classes/warrior", "/era/guides/raids"]) expect((await page.goto(path))?.status()).toBe(200);
  for (const path of ["/era/guides/classes/mage/frost", "/era/guides/raids/blackwing-lair", "/tbc/guides/classes/warrior/fury", "/tbc/guides/raids/molten-core"]) expect((await page.goto(path))?.status()).toBe(404);
});
test("Fury sections and central gear render with one reusable Wowhead script", async ({ page }) => {
  await page.route("https://wow.zamimg.com/js/tooltips.js", route => route.fulfill({ contentType: "application/javascript", body: "window.__guideTooltips=0;window.$WowheadPower={refreshLinks(){window.__guideTooltips++}};" }));
  await page.goto(fury);
  for (const id of ["talents", "stats", "rotation", "consumables", "gear", "raid-preparation", "boss-notes", "sources"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.getByText("Last reviewed:")).toContainText("2026-09-21");
  await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __guideTooltips: number }).__guideTooltips)).toBeGreaterThan(0);
  for (const { set, slots } of resolveGuideGear("era-warrior-fury", [0, 1])) {
    const section = page.locator(`[data-guide-gear-set="${set.id}"]`);
    const first = slots[0].items[0]; await section.locator("summary").first().click();
    const item = section.locator(`[data-guide-item-id="${first.item.itemId}"]`).first();
    await expect(item).toContainText(first.item.name);
    await expect(item.getByRole("link")).toHaveAttribute("href", `https://www.wowhead.com/classic/item=${first.item.itemId}`);
  }
  await expect(page.getByText(/View your personalized advice/)).toHaveCount(0);
});
test("Molten Core has ten ordered ID-mapped cards and every boss route is complete", async ({ page }) => {
  await page.goto(mc);
  const links = page.getByTestId("boss-cards").getByRole("link");
  await expect(links).toHaveCount(10);
  expect(await links.evaluateAll(elements => elements.map(element => Number(element.getAttribute("data-encounter-id"))))).toEqual(moltenCoreEncounters.map(boss => boss.id));
  for (const boss of publishedGuides("era").filter(guide => guide.type === "boss")) {
    expect((await page.goto(guideHref(boss)))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(boss.title);
    for (const title of ["Raid-night summary", "Key mechanics", "Positioning", "Tank", "Healer", "DPS", "Fury Warrior note", "Sources / reviewed against"]) await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("Molten Core");
    await expect(page.getByRole("navigation", { name: "Boss navigation" })).toBeVisible();
  }
});
test("indexable guide metadata, sitemap and character crawl policy remain separate", async ({ page, request }) => {
  await page.goto(fury);
  await expect(page).toHaveTitle(/Fury Warrior.*Classic Era/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/era\/guides\/classes\/warrior\/fury$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Fury Warrior/);
  const sitemap = await request.get("/sitemap.xml"); expect(sitemap.status()).toBe(200); const xml = await sitemap.text();
  for (const guide of publishedGuides()) expect(xml).toContain(guideHref(guide));
  expect(xml).not.toContain("/characters/");
  await page.goto("/era/characters/era/eu/firemaw/aidy");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});
test("TBC empty state and guide version switch never relabel Era content", async ({ page }) => {
  await page.goto(fury); await page.getByRole("button", { name: "TBC", exact: true }).click();
  await expect(page).toHaveURL(/\/tbc\/guides$/); await expect(page.getByRole("main")).toContainText("TBC guides are coming later");
  await expect(page.getByRole("main").getByRole("link", { name: /Fury|Molten/ })).toHaveCount(0);
});
test("public, saved and Advice links require matching Fury specialization", async ({ page }) => {
  await page.goto("/era/characters/era/eu/firemaw/aidy"); await expect(page.getByRole("link", { name: "View Fury Warrior guide" })).toBeVisible();
  await resetPlayerState();
  try {
    await signIn(page); await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=aidy"); await addCharacter(page);
    await expect(page.locator('#saved-character').getByRole("link", { name: "View Fury Warrior guide" })).toBeVisible();
    await expect(page.locator('#character-advice').getByRole("link", { name: "View Fury Warrior guide" })).toBeVisible();
  } finally { await resetPlayerState(); }
  await page.goto("/tbc/characters/anniversary/eu/spineshatter/aidy");
  await expect(page.getByRole("link", { name: "View Fury Warrior guide" })).toHaveCount(0);
});
test("Logs links use exact raid and encounter IDs, never display strings", async ({ page }) => {
  const url = process.env.E2E_DATABASE_URL!; expect(["127.0.0.1", "localhost"]).toContain(new URL(url).hostname);
  const client = new Client({ connectionString: url }); await client.connect();
  const key = logsCacheKey({ contentVersion: "era", realmType: "era", region: "eu", realm: "firemaw", characterName: "aidy" }, { site: "vanilla", ecosystem: "era", registryRevision: "synthetic-display-fixtures-v1" });
  await page.goto("/era/characters/era/eu/firemaw/aidy");
  await expect(page.locator("#character-logs")).toContainText("Ragnaros");
  await expect(page.locator('#character-logs a[href*="/guides/"]')).toHaveCount(0);
  const original = (await client.query("SELECT projection FROM warcraft_logs_cache WHERE cache_key=$1", [key])).rows[0].projection;
  try {
    const projection = structuredClone(original); projection.raids[0].zoneId = 2000;
    projection.raids[0].bosses[0].encounterId = 50663; projection.raids[0].bosses[0].name = "Deliberately different display name";
    await client.query("UPDATE warcraft_logs_cache SET projection=$2 WHERE cache_key=$1", [key, JSON.stringify(projection)]);
    await page.reload();
    await expect(page.locator("#character-logs").getByRole("link", { name: "Molten Core guide", exact: true })).toHaveAttribute("href", mc);
    await expect(page.locator("#character-logs").getByRole("link", { name: "Lucifron guide", exact: true })).toHaveAttribute("href", `${mc}/lucifron`);
    await expect(page.locator("#character-logs").getByRole("link", { name: "Ragnaros guide", exact: true })).toHaveCount(0);
  } finally { await client.query("UPDATE warcraft_logs_cache SET projection=$2 WHERE cache_key=$1", [key, JSON.stringify(original)]); await client.end(); }
});
for (const width of [1440, 390]) test(`guides axe, keyboard, readable blocked tooltips and no overflow at ${width}px`, async ({ page }) => {
  test.setTimeout(120000); await page.setViewportSize({ width, height: 900 }); await page.route("https://wow.zamimg.com/**", route => route.abort());
  for (const path of ["/era/guides", fury, mc, `${mc}/ragnaros`, "/tbc/guides"]) {
    await page.goto(path); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  }
  await page.goto("/era/guides");
  const menu = page.locator(".site-header summary"); await menu.focus(); await page.keyboard.press("Enter");
  const menuGuide = page.locator(".site-header details").getByRole("link", { name: "Guides", exact: true });
  await menuGuide.focus(); await expect(menuGuide).toBeFocused(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/\/era\/guides$/);
  await page.goto(fury); if (width < 1024) { const summary = page.locator(".guide-toc summary"); await summary.focus(); await page.keyboard.press("Enter"); }
  const rotation = page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Rotation / priority" });
  await rotation.focus(); await expect(rotation).toBeFocused(); expect(await rotation.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter"); await expect(page).toHaveURL(/#rotation$/);
  const item = page.locator("#consumables a").first(); await item.focus(); await expect(item).toBeFocused(); await expect(item).toHaveAttribute("href", /wowhead.com\/classic\/item=/);
  await page.goto(mc); const boss = page.getByTestId("boss-cards").getByRole("link").first(); await boss.focus(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/\/lucifron$/);
  const next = page.getByRole("navigation", { name: "Boss navigation" }).getByRole("link").last(); await next.focus(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/\/magmadar$/);
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumbs" }).getByRole("link", { name: "Molten Core", exact: true }); await breadcrumb.focus(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(new RegExp(`${mc}$`));
});
