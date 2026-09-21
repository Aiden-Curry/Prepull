import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";
import { addCharacter, base, resetPlayerState, signIn, advanceLyriaFixture } from "./helpers";
import fixture from "../fixtures/classic-armory.json";
import { normalizeTalentState, normalizeStatistics } from "../../lib/armory/normalize";
import { normalizeEquipment } from "../../lib/armory/equipment";
import { projectPublicCharacter, publicLookupCacheKey } from "../../lib/public-character/lookup";

test("realm combobox supports keyboard, region clearing and ecosystem separation without character quota calls", async ({ page }) => {
  let lookups = 0; page.on("request", (request) => { if (request.url().includes("/api/public/characters")) lookups++; });
  await page.goto("/era#character-search"); const finder = page.locator("#character-search"), realm = finder.getByRole("combobox", { name: "Realm", exact: true });
  await realm.focus(); await realm.fill("Fire"); await expect(finder.getByRole("option", { name: /Firemaw/ })).toBeVisible();
  await realm.press("ArrowDown"); await realm.press("ArrowUp"); await realm.press("Enter"); await expect(realm).toHaveValue("Firemaw");
  await realm.press("Escape"); await realm.click(); await expect(realm).toHaveAttribute("aria-expanded", "true");
  await finder.getByLabel("Region", { exact: true }).selectOption("us"); await expect(realm).toHaveValue("");
  await realm.fill("White"); await realm.press("ArrowDown"); await realm.press("Enter"); await expect(realm).toHaveValue("Whitemane");
  await finder.getByRole("button", { name: "ANNIVERSARY", exact: true }).click(); await expect(realm).toHaveValue(""); await realm.click(); await expect(finder.getByRole("option", { name: /Nightslayer/ })).toBeVisible(); await expect(finder.getByRole("option", { name: /Firemaw/ })).toHaveCount(0);
  expect(lookups).toBe(0);
  await realm.press("Escape"); const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
});

test("public Armory renders safe slot equipment and remains usable with Wowhead blocked on mobile", async ({ page }) => {
  await page.route("https://wow.zamimg.com/**", (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/era/characters/era/eu/firemaw/aidy");
  const sheet = page.getByRole("region", { name: "Character sheet" }); await expect(sheet).toHaveAttribute("data-armory-source", "public");
  await expect(sheet.locator("[data-slot]")).toHaveCount(19); await expect(sheet.locator('[data-slot="shirt"]')).toContainText("Empty");
  await expect(sheet.locator("img").first()).toBeVisible(); await expect(sheet.getByRole("heading", { name: "Statistics", exact: true })).toBeVisible(); await expect(sheet).toContainText("4,200"); await expect(sheet).toContainText("Talent data isn't currently available"); await expect(sheet).toContainText("Retrieved:");
  const item = sheet.locator('[data-slot="head"] a'); await expect(item).toHaveAttribute("href", /wowhead.com\/classic\/item=\d+/); await expect(item).toHaveAttribute("rel", "noopener noreferrer"); await item.focus(); await expect(item.locator(".armory-focus-details")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await expect(page.locator("body")).not.toContainText(/userId|syncId|character_sync|session planner|e2e-owner@/i);
  const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.screenshot({ path: "test-results/armory-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 }); await page.screenshot({ path: "test-results/armory-desktop.png", fullPage: true });
});

test("saved Armory changes only through a persisted refresh and preserves the last success after provider failure", async ({ page }) => {
  await resetPlayerState();
  await page.route("https://wow.zamimg.com/js/tooltips.js", (route) => route.fulfill({ contentType: "application/javascript", body: "window.__tooltipRefreshes=0;window.$WowheadPower={refreshLinks:function(){window.__tooltipRefreshes++}};" }));
  try {
    await signIn(page); await page.goto("/era/characters/connect"); await page.getByLabel("Region", { exact: true }).selectOption("us");
    const realm = page.getByRole("combobox", { name: "Realm", exact: true }); await realm.fill("White"); await realm.press("ArrowDown"); await realm.press("Enter");
    await page.getByLabel("Character name").fill("Lyria"); await page.getByRole("button", { name: "Search character" }).click(); await addCharacter(page);
    const sheet = page.getByRole("region", { name: "Character sheet" }); await expect(sheet).toHaveAttribute("data-armory-source", "persisted"); await expect(sheet).toContainText("Last synced:");
    await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => (window as any).__tooltipRefreshes)).toBeGreaterThan(0);
    const refreshes = await page.evaluate(() => (window as any).__tooltipRefreshes);
    await advanceLyriaFixture(); await page.getByRole("button", { name: "Refresh character" }).click(); await expect(sheet).toContainText("Fordring's Seal");
    await expect.poll(() => page.evaluate(() => (window as any).__tooltipRefreshes)).toBeGreaterThan(refreshes);
    await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
    const client = new Client({ connectionString: process.env.E2E_DATABASE_URL }); await client.connect();
    try { await client.query("UPDATE user_characters SET character_name='Providerdown',normalized_character_name='providerdown' WHERE user_id=(SELECT id FROM users WHERE email=$1)", [base.email]); await client.query("UPDATE character_syncs SET synced_at=synced_at-interval '31 seconds' WHERE user_character_id IN (SELECT id FROM user_characters WHERE user_id=(SELECT id FROM users WHERE email=$1))", [base.email]); } finally { await client.end(); }
    await page.reload(); await expect(sheet).toContainText("Fordring's Seal");
    await page.getByRole("button", { name: "Refresh character" }).click(); await expect(sheet).toContainText("Fordring's Seal");
    const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    // The mock provider throws for Providerdown: a successful deep link proves DB-only loading.
    await page.goto("/era/character/era/us/whitemane/providerdown");
    await expect(sheet).toHaveAttribute("data-armory-source", "persisted"); await expect(sheet).toContainText("Fordring's Seal");
    const gear = await page.goto("/era/character/era/us/whitemane/providerdown/gear/head"); expect(gear?.status()).toBe(200);
    await expect(page.locator("body")).not.toContainText("Provider unavailable");
  } finally { await resetPlayerState(); }
});

test("observed Classic talent fixture renders active totals and spell links without invented positions", async ({ page }) => {
  const client = new Client({ connectionString: process.env.E2E_DATABASE_URL }); await client.connect();
  const now = new Date(); const lookup = { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: "firemaw", characterName: "fixturetalents" };
  const key = publicLookupCacheKey(lookup);
  const projection = projectPublicCharacter({ id: "must-not-be-public", name: "Fixturetalents", region: "eu", realm: "Firemaw", realmType: "era", contentVersion: "era", level: 60, class: "Warrior", race: "Human", faction: "Alliance", spec: "Protection", professions: [], equipment: normalizeEquipment(fixture.equipment), dataMeta: { provider: "mock", isLive: false }, armory: { statistics: normalizeStatistics(fixture.statistics, now.toISOString()), talents: normalizeTalentState(fixture.specializations, now.toISOString()) } }, now);
  // This fixture captures an observed Blizzard response; it is not evidence of a new provider capability.
  try {
    await client.query("INSERT INTO public_character_lookup_cache(cache_key,status,projection,expires_at,created_at,updated_at) VALUES($1,'found',$2,now()+interval '10 minutes',now(),now()) ON CONFLICT(cache_key) DO UPDATE SET projection=excluded.projection,expires_at=excluded.expires_at", [key, JSON.stringify(projection)]);
    await page.route("https://wow.zamimg.com/**", (route) => route.abort());
    await page.goto("/era/characters/era/eu/firemaw/fixturetalents");
    const talents = page.locator("#character-talents");
    await expect(talents.getByRole("heading", { name: /Protection\s*16 points/ })).toBeVisible();
    await expect(talents).toContainText("32 points"); await expect(talents).toContainText("3 points");
    await expect(talents.getByRole("link", { name: "Anticipation" })).toHaveAttribute("href", "https://www.wowhead.com/classic/spell=12753");
    await expect(page.locator("body")).not.toContainText("must-not-be-public");
    await expect(page.getByRole("link", { name: "View Fury Warrior guide" })).toHaveCount(0);
  } finally { await client.query("DELETE FROM public_character_lookup_cache WHERE cache_key=$1", [key]); await client.end(); }
});
