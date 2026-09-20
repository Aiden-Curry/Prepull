import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";
import { addCharacter, base, resetPlayerState, signIn } from "./helpers";
import { logsCacheKey } from "../../lib/warcraft-logs/identity";
import { projectPublicCharacter, publicLookupCacheKey } from "../../lib/public-character/lookup";

const context = { site: "vanilla" as const, ecosystem: "era" as const, registryRevision: "synthetic-display-fixtures-v1" };
const aidy = { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: "firemaw", characterName: "aidy" };
async function database() { const url = process.env.E2E_DATABASE_URL; if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Logs fixture tests require isolated local PostgreSQL"); const client = new Client({ connectionString: url }); await client.connect(); return client; }
async function open(page: Page, path: string) {
  await page.route("https://wow.zamimg.com/**", route => route.abort());
  const response = await page.goto(path); expect(response?.status()).toBe(200);
  await expect(page.locator("#character-logs")).not.toHaveAttribute("aria-busy", "true");
  await page.getByRole("navigation", { name: "Character sections" }).getByRole("link", { name: "Logs", exact: true }).click();
}
async function axe(page: Page) { const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]); }

test("full clear, kills, provider aggregate labels, recent raids and attribution", async ({ page }) => {
  await open(page, "/era/characters/era/eu/firemaw/aidy"); const logs = page.locator("#character-logs");
  await expect(logs).toContainText("Synthetic display fixture"); await expect(logs).toContainText("10 / 10 bosses killed · Cleared");
  await expect(logs).toContainText("Ragnaros"); await expect(logs).toContainText("Best Performance Avg"); await expect(logs).toContainText("92.4"); await expect(logs).toContainText("Median Performance Avg"); await expect(logs).toContainText("79.2");
  await expect(logs.locator("li").filter({ has: page.getByRole("heading", { name: "Ragnaros", exact: true }) })).toContainText("7");
  await expect(logs.getByRole("heading", { name: "Recent public raids" })).toBeVisible();
  await expect(logs.getByRole("link", { name: /Data from Warcraft Logs/ })).toHaveAttribute("href", "https://vanilla.warcraftlogs.com");
  // Synthetic report codes deliberately have no misleading live report link.
  await expect(logs.locator('a[href*="/reports/"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/access_token|client_secret|lease_owner|userId/);
  await axe(page);
});
test("partial raid progression is not a clear and absent aggregates stay absent", async ({ page }) => {
  await open(page, "/era/characters/era/us/whitemane/lyria");
  const raid = page.locator("#character-logs details").filter({ has: page.locator("summary", { hasText: "Temple of Ahn'Qiraj" }) });
  await expect(raid).toContainText("6 / 9 bosses killed"); await expect(raid).not.toContainText("Cleared"); await expect(raid).not.toContainText("Performance Avg");
});
test("multiple observed specs and tank metrics stay separate", async ({ page }) => {
  await open(page, "/era/characters/era/eu/firemaw/freshfury");
  const boss = page.locator("#character-logs li").filter({ has: page.getByRole("heading", { name: "Ragnaros", exact: true }) });
  await expect(boss).toContainText("Fury · Damage · DPS"); await expect(boss).toContainText("Protection · Tank · DPS");
});
test("healer logs use HPS", async ({ page }) => {
  await open(page, "/era/characters/era/eu/firemaw/elowen");
  await expect(page.locator("#character-logs")).toContainText("Holy · Healer · HPS"); await expect(page.locator("#character-logs")).not.toContainText("DPS");
});
for (const [path, message] of [
  ["/era/characters/era/us/whitemane/pyra", "Warcraft Logs rankings are hidden"],
  ["/era/characters/era/eu/firemaw/rivyn", "No public Warcraft Logs data found"],
  ["/era/characters/era/us/whitemane/talan", "Warcraft Logs is temporarily unavailable"],
]) test(`isolated Logs state: ${message}`, async ({ page }) => {
  await open(page, path); await expect(page.locator("#character-logs")).toContainText(message);
  await expect(page.getByRole("heading", { name: "Equipment", exact: true })).toBeVisible(); await expect(page.locator("[data-slot]")).toHaveCount(19);
  await expect(page.locator("#character-logs")).not.toContainText(/never raided|unready|no raid experience/i);
  await axe(page);
});
test("a failed raid does not discard successful raids", async ({ page }) => {
  await open(page, "/era/characters/era/us/whitemane/lyriaprogress");
  await expect(page.locator("#character-logs")).toContainText("Raid data temporarily unavailable");
  await expect(page.locator("#character-logs")).toContainText("10 / 10 bosses killed · Cleared");
});
test("not-found remains distinct while the public Armory stays available", async ({ page }) => {
  const client = await database(); const input = { ...aidy, characterName: "logsmissing" };
  const key = publicLookupCacheKey(input);
  const projection = projectPublicCharacter({ id: "synthetic-not-public", name: "Logsmissing", realm: "Firemaw", region: "eu", realmType: "era", contentVersion: "era", level: 60, class: "Warrior", spec: "Fury", race: "Human", faction: "Alliance", professions: [], equipment: [], dataMeta: { provider: "mock", isLive: false } }, new Date());
  try {
    await client.query("INSERT INTO public_character_lookup_cache(cache_key,status,projection,expires_at) VALUES($1,'found',$2,now()+interval '10 minutes') ON CONFLICT(cache_key) DO UPDATE SET projection=excluded.projection,expires_at=excluded.expires_at", [key, JSON.stringify(projection)]);
    await open(page, "/era/characters/era/eu/firemaw/logsmissing");
    await expect(page.locator("#character-logs")).toContainText("No Warcraft Logs character was found");
    await expect(page.getByRole("heading", { name: "Equipment", exact: true })).toBeVisible();
  } finally { await client.query("DELETE FROM public_character_lookup_cache WHERE cache_key=$1", [key]); await client.end(); }
});
test("unverified Anniversary context never substitutes Era raids", async ({ page }) => {
  await open(page, "/tbc/characters/anniversary/eu/spineshatter/aidy");
  await expect(page.locator("#character-logs")).toContainText("Warcraft Logs is unavailable for this game context");
  await expect(page.locator("#character-logs")).not.toContainText("Molten Core");
});
test("390px layout, keyboard navigation and raid expansion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page, "/era/characters/era/eu/firemaw/aidy");
  const nav = page.getByRole("navigation", { name: "Character sections" });
  await nav.getByRole("link", { name: "Character", exact: true }).focus(); await page.keyboard.press("Tab"); await expect(nav.getByRole("link", { name: "Talents", exact: true })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(nav.getByRole("link", { name: "Logs", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
  const summary = page.locator("#character-logs summary").first(); await summary.focus(); await page.keyboard.press("Enter"); await expect(page.locator("#character-logs details").first()).not.toHaveAttribute("open", "");
  await page.keyboard.press("Enter"); await expect(page.locator("#character-logs details").first()).toHaveAttribute("open", "");
  const link = page.getByRole("link", { name: /Data from Warcraft Logs/ }); await link.focus(); await expect(link).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await axe(page); await page.screenshot({ path: "test-results/p1c/logs-mobile.png", fullPage: true });
});
test("public cache is reused by saved Logs without a Blizzard refresh", async ({ page }) => {
  await resetPlayerState(); const client = await database();
  try {
    await open(page, "/era/characters/era/eu/firemaw/aidy");
    const key = logsCacheKey(aidy, context);
    const before = (await client.query("SELECT updated_at FROM warcraft_logs_cache WHERE cache_key=$1", [key])).rows[0].updated_at;
    await signIn(page); await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=aidy"); await addCharacter(page);
    const counts = async () => (await client.query("SELECT count(*)::int AS count FROM character_syncs s JOIN user_characters c ON c.id=s.user_character_id JOIN users u ON u.id=c.user_id WHERE u.email=$1", [base.email])).rows[0].count;
    const syncs = await counts();
    await expect(page.locator("#character-logs")).toContainText("10 / 10 bosses killed");
    await page.getByRole("navigation", { name: "Character sections" }).getByRole("link", { name: "Logs", exact: true }).focus();
    await page.keyboard.press("Tab"); await expect(page.getByRole("navigation", { name: "Character sections" }).getByRole("link", { name: "Advice", exact: true })).toBeFocused();
    await page.keyboard.press("Tab"); await expect(page.getByRole("navigation", { name: "Character sections" }).getByRole("link", { name: "Progress", exact: true })).toBeFocused();
    await page.reload(); await expect(page.locator("#character-logs")).toContainText("10 / 10 bosses killed");
    expect(await counts()).toBe(syncs);
    const after = (await client.query("SELECT updated_at FROM warcraft_logs_cache WHERE cache_key=$1", [key])).rows[0].updated_at;
    expect(after.getTime()).toBe(before.getTime());
    // Force the Blizzard provider's known failure identity. Saved view must
    // continue from its persisted snapshot without calling that provider.
    await client.query("UPDATE user_characters SET character_name='Providerdown',normalized_character_name='providerdown' WHERE user_id=(SELECT id FROM users WHERE email=$1)", [base.email]);
    await page.reload(); await expect(page.locator('[data-armory-source="persisted"]')).toBeVisible(); expect(await counts()).toBe(syncs);
  } finally { await client.end(); await resetPlayerState(); }
});
