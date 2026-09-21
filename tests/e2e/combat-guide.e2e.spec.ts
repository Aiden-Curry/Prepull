import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";
import { resolveGuideGear } from "../../lib/guides/gear";
import { signIn, addCharacter, resetPlayerState, base } from "./helpers";

const combat = "/era/guides/classes/rogue/combat";
test("Combat discovery, sections, SEO and TBC separation", async ({ page, request }) => {
  await page.goto("/era/guides"); await page.getByLabel("Find a guide").fill("combat");
  await expect(page.getByRole("heading", { name: "Combat Rogue", exact: true })).toBeVisible();
  for (const path of ["/era/guides/classes/rogue", combat]) expect((await page.goto(path))?.status()).toBe(200);
  for (const id of ["overview", "strengths", "talents", "stats", "weapon-skill", "rotation", "slice-and-dice", "cooldowns", "poisons", "consumables", "world-buffs", "professions", "gear", "raid-preparation", "mistakes", "sources"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page).toHaveTitle(/Combat Rogue.*Classic Era/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(combat, process.env.PREPULL_SITE_URL ?? process.env.NEXTAUTH_URL!).href);
  await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("Rogue");
  const sitemap = await (await request.get("/sitemap.xml")).text(); expect(sitemap).toContain(combat); expect(sitemap).not.toContain("/tbc/guides/classes/rogue/combat");
  await page.getByRole("button", { name: "TBC", exact: true }).click(); await expect(page.getByRole("main")).toContainText("TBC guides are coming later");
  for (const path of ["/tbc/guides/classes/rogue/combat", "/era/guides/classes/rogue/assassination", "/era/guides/classes/rogue/subtlety"]) expect((await page.goto(path))?.status()).toBe(404);
});

test("Combat shared gear renders both phases with one Wowhead script", async ({ page }) => {
  await page.route("https://wow.zamimg.com/js/tooltips.js", route => route.fulfill({ contentType: "application/javascript", body: "window.$WowheadPower={refreshLinks(){}};" }));
  await page.goto(combat); await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
  for (const { set, slots } of resolveGuideGear("era-rogue-combat", [0, 1])) {
    const group = page.locator(`[data-guide-gear-set="${set.id}"]`); await expect(group).toBeVisible();
    await group.locator("summary").first().click();
    const first = slots[0].items[0]; const item = group.locator(`[data-guide-item-id="${first.item.itemId}"]`).first();
    await expect(item).toContainText(first.item.name); await expect(item.getByRole("link")).toHaveAttribute("href", `https://www.wowhead.com/classic/item=${first.item.itemId}`);
  }
});

test("Combat public and saved Advice links exclude non-Combat Rogues", async ({ page }) => {
  const url = process.env.E2E_DATABASE_URL!; expect(new URL(url).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
  await page.goto("/era/characters/era/eu/firemaw/rivyn");
  const link = page.getByRole("link", { name: "View Combat Rogue guide", exact: true }); await expect(link).toHaveAttribute("href", combat);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await link.click(); await expect(page).toHaveURL(new RegExp(`${combat}$`));
  await resetPlayerState(); const client = new Client({ connectionString: url }); await client.connect();
  try {
    await signIn(page); await page.goto("/era/characters/connect?search=1&region=eu&realmType=era&realm=firemaw&name=rivyn"); await addCharacter(page);
    for (const id of ["saved-character", "character-advice"]) await expect(page.locator(`#${id}`).getByRole("link", { name: "View Combat Rogue guide", exact: true })).toHaveAttribute("href", combat);
    await page.locator("#character-advice").getByRole("link", { name: "View Combat Rogue guide", exact: true }).click(); await expect(page).toHaveURL(new RegExp(`${combat}$`));
    for (const spec of ["Assassination", "Subtlety"]) {
      const result = await client.query("UPDATE character_syncs s SET spec=$2 FROM user_characters c, users u WHERE s.user_character_id=c.id AND c.user_id=u.id AND u.email=$1", [base.email, spec]); expect(result.rowCount).toBe(1);
      await page.goto("/era/dashboard"); await expect(page.locator('[data-armory-source="persisted"]')).toContainText(spec);
      await expect(page.getByRole("link", { name: "View Combat Rogue guide", exact: true })).toHaveCount(0);
    }
  } finally { await client.end(); await resetPlayerState(); }
});

for (const width of [1440, 390]) test(`Combat mobile/desktop TOC and axe at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.route("https://wow.zamimg.com/**", route => route.abort());
  await page.goto(combat);
  for (const group of await page.locator('[data-guide-gear-set]').all()) await group.locator('summary').first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  if (width < 1024) await page.locator(".guide-toc summary").click();
  const anchor = page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Slice and Dice usage" }); await anchor.focus(); await expect(anchor).toBeFocused(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/#slice-and-dice$/);
  await expect(page.locator('#consumables a').first()).toContainText("Thistle Tea");
});
