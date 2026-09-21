import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolveGuideGear } from "../../lib/guides/gear";
import { signIn, addCharacter, resetPlayerState } from "./helpers";

const frost = "/era/guides/classes/mage/frost";
test("Frost route, discovery, sections, SEO and TBC separation", async ({ page, request }) => {
  await page.goto("/era/guides");
  await page.getByLabel("Find a guide").fill("frost");
  await expect(page.getByRole("heading", { name: "Frost Mage", exact: true })).toBeVisible();
  for (const path of ["/era/guides/classes/mage", frost]) expect((await page.goto(path))?.status()).toBe(200);
  for (const id of ["overview", "strengths", "talents", "stats", "rotation", "cooldowns", "consumables", "world-buffs", "professions", "gear", "raid-preparation", "mistakes", "sources"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page).toHaveTitle(/Frost Mage.*Classic Era/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(frost, process.env.PREPULL_SITE_URL ?? process.env.NEXTAUTH_URL!).href);
  await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("Mage");
  const sitemap = await (await request.get("/sitemap.xml")).text(); expect(sitemap).toContain(frost); expect(sitemap).not.toContain("/tbc/guides/classes/mage/frost");
  await page.getByRole("button", { name: "TBC", exact: true }).click();
  await expect(page.getByRole("main")).toContainText("TBC guides are coming later");
  for (const path of ["/tbc/guides/classes/mage/frost", "/era/guides/classes/mage/fire", "/era/guides/classes/mage/arcane"]) expect((await page.goto(path))?.status()).toBe(404);
});

test("Frost accepted gear and one Wowhead integration", async ({ page }) => {
  await page.route("https://wow.zamimg.com/js/tooltips.js", route => route.fulfill({ contentType: "application/javascript", body: "window.$WowheadPower={refreshLinks(){}};" }));
  await page.goto(frost);
  await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
  for (const { set, slots } of resolveGuideGear("era-mage-frost", [0, 1])) {
    const group = page.locator(`[data-guide-gear-set="${set.id}"]`);
    await expect(group).toBeVisible(); await group.locator("summary").first().click();
    const first = slots[0].items[0]; const item = group.locator(`[data-guide-item-id="${first.item.itemId}"]`).first();
    await expect(item).toContainText(first.item.name);
    await expect(item.getByRole("link")).toHaveAttribute("href", `https://www.wowhead.com/classic/item=${first.item.itemId}`);
  }
});

test("Frost public character and saved Advice links require matching specialization", async ({ page }) => {
  expect(new URL(process.env.E2E_DATABASE_URL!).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
  await page.goto("/era/characters/era/us/whitemane/lyria");
  await expect(page.getByRole("link", { name: "View Frost Mage guide", exact: true })).toHaveAttribute("href", frost);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await page.goto("/era/characters/era/us/whitemane/pyra");
  await expect(page.getByRole("link", { name: "View Frost Mage guide", exact: true })).toHaveCount(0);
  await resetPlayerState();
  try {
    await signIn(page); await page.goto("/era/characters/connect?search=1&region=us&realmType=era&realm=whitemane&name=lyria"); await addCharacter(page);
    for (const id of ["saved-character", "character-advice"]) await expect(page.locator(`#${id}`).getByRole("link", { name: "View Frost Mage guide", exact: true })).toHaveAttribute("href", frost);
    await page.locator("#character-advice").getByRole("link", { name: "View Frost Mage guide", exact: true }).click(); await expect(page).toHaveURL(new RegExp(`${frost}$`));
  } finally { await resetPlayerState(); }
});

test("Frost mobile TOC, readable blocked tooltips and axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://wow.zamimg.com/**", route => route.abort());
  await page.goto(frost); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.locator(".guide-toc summary").click(); await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Spell priority / rotation" }).click(); await expect(page).toHaveURL(/#rotation$/);
  await expect(page.locator('#consumables a').first()).toContainText("Major Mana Potion");
});
