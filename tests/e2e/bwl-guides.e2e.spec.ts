import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";
import { logsCacheKey } from "../../lib/warcraft-logs/identity";
import { raidProgressionEncounters } from "../../lib/guides/registry";

const path = "/era/guides/raids/blackwing-lair";
test("BWL Logs links follow encounter IDs despite misleading display names", async ({ page }) => {
  const url = process.env.E2E_DATABASE_URL!;
  expect(["127.0.0.1", "localhost"]).toContain(new URL(url).hostname);
  const client = new Client({ connectionString: url });
  await client.connect();
  const key = logsCacheKey({ contentVersion: "era", realmType: "era", region: "eu", realm: "firemaw", characterName: "aidy" }, { site: "vanilla", ecosystem: "era", registryRevision: "synthetic-display-fixtures-v1" });
  let original;
  try {
    await page.goto("/era/characters/era/eu/firemaw/aidy");
    await expect(page.locator("#character-logs")).toContainText("Ragnaros");
    original = (await client.query("SELECT projection FROM warcraft_logs_cache WHERE cache_key=$1", [key])).rows[0].projection;
    const projection = structuredClone(original);
    const raid = projection.raids[0]; raid.zoneId = 2002;
    const sample = raid.bosses[0];
    raid.bosses = [50610, 50611, 50612, 50613, 50614, 50615, 50616, 50617, 50631].map(encounterId => ({ ...sample, encounterId, name: "Razorgore the Untamed" }));
    await client.query("UPDATE warcraft_logs_cache SET projection=$2 WHERE cache_key=$1", [key, JSON.stringify(projection)]);
    await page.reload();
    const logs = page.locator("#character-logs");
    await expect(logs.getByRole("link", { name: "Razorgore the Untamed guide", exact: true })).toHaveAttribute("href", `${path}/razorgore-the-untamed`);
    await expect(logs.getByRole("link", { name: "Vaelastrasz the Corrupt guide", exact: true })).toHaveAttribute("href", `${path}/vaelastrasz-the-corrupt`);
    await expect(logs.getByRole("link", { name: "Broodlord Lashlayer guide", exact: true })).toHaveAttribute("href", `${path}/broodlord-lashlayer`);
    await expect(logs.getByRole("link", { name: "Firemaw guide", exact: true })).toHaveAttribute("href", `${path}/firemaw`);
    await expect(logs.getByRole("link", { name: "Ebonroc guide", exact: true })).toHaveAttribute("href", `${path}/ebonroc`);
    await expect(logs.getByRole("link", { name: "Flamegor guide", exact: true })).toHaveAttribute("href", `${path}/flamegor`);
    await expect(logs.locator(`a[href^="${path}/"]`)).toHaveCount(6);
  } finally {
    if (original) await client.query("UPDATE warcraft_logs_cache SET projection=$2 WHERE cache_key=$1", [key, JSON.stringify(original)]);
    await client.end();
  }
});
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
  await expect(cards.getByRole("link")).toHaveCount(6);
  expect(await cards.getByRole("link").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-encounter-id"))))).toEqual([50610, 50611, 50612, 50613, 50614, 50615]);
  await expect(cards.getByText("Boss guide not yet published.", { exact: true })).toHaveCount(2);
  await expect(cards).not.toContainText("Ebonroc / Flamegor");
  expect((await request.get(`${path}/ebonroc-flamegor`)).status()).toBe(404);
  for (const boss of raidProgressionEncounters("era", 2002)) {
    const slug = boss.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    expect((await request.get(`${path}/${slug}`)).status()).toBe([50610, 50611, 50612, 50613, 50614, 50615].includes(boss.id) ? 200 : 404);
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
  expect(xml).toContain(`${path}/razorgore-the-untamed`);
  expect(xml).toContain(`${path}/vaelastrasz-the-corrupt`);
  expect(xml).toContain(`${path}/broodlord-lashlayer`);
  expect(xml).toContain(`${path}/firemaw`);
  expect(xml).toContain(`${path}/ebonroc`);
  expect(xml).toContain(`${path}/flamegor`);
  expect(xml).not.toContain(`${path}/chromaggus`);
  expect(xml).not.toContain(`${path}/nefarian`);
  expect(xml).not.toContain(`${path}/ebonroc-flamegor`);
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

for (const [slug, title, sibling, direction] of [
  ["razorgore-the-untamed", "Razorgore the Untamed", "vaelastrasz-the-corrupt", "Next"],
  ["vaelastrasz-the-corrupt", "Vaelastrasz the Corrupt", "razorgore-the-untamed", "Previous"],
  ["broodlord-lashlayer", "Broodlord Lashlayer", "firemaw", "Next"],
  ["firemaw", "Firemaw", "broodlord-lashlayer", "Previous"],
  ["ebonroc", "Ebonroc", "flamegor", "Next"],
  ["flamegor", "Flamegor", "ebonroc", "Previous"],
]) test(`BWL boss ${slug}: route, navigation, SEO, mobile and axe`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  expect((await page.goto(`${path}/${slug}`))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  for (const id of ["quick-summary", "mechanics", "positioning", "tank", "healer", "dps", "dispels", "preparation", "mistakes", "fury", "sources"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumbs" }).getByRole("link", { name: "Blackwing Lair", exact: true })).toHaveAttribute("href", path);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}/${slug}$`));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(issue => ["serious", "critical"].includes(issue.impact ?? ""))).toEqual([]);
  const navigation = page.getByRole("navigation", { name: "Boss navigation" });
  await expect(navigation.getByRole("link")).toHaveCount(["vaelastrasz-the-corrupt", "broodlord-lashlayer", "firemaw", "ebonroc"].includes(slug) ? 2 : 1);
  await navigation.getByRole("link", { name: new RegExp(direction) }).click();
  await expect(page).toHaveURL(new RegExp(`/${sibling}$`));
  expect((await page.goto(`/tbc/guides/raids/blackwing-lair/${slug}`))?.status()).toBe(404);
});
