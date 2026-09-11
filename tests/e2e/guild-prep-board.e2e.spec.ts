import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { eraCombatRogueFixtures, eraHolyPriestFixtures, eraMarksmanshipHunterFixtures } from "../../lib/gear-analysis/additional-spec-fixtures";
import { eraFuryFixtures } from "../../lib/gear-analysis/fixtures";
import { eraFrostMageFixtures } from "../../lib/gear-analysis/mage-fixtures";
import type { NormalizedCharacter } from "../../lib/types";
import { signIn } from "./helpers";

const databaseUrl = () => process.env.E2E_DATABASE_URL ?? "postgres://prepull:prepull-test-only@localhost:5433/prepull_test";
async function database() { const client = new Client({ connectionString: databaseUrl() }); await client.connect(); return client; }

async function fixtureIds(client: Client) {
  const guild = (await client.query("SELECT id FROM guilds WHERE name='E2E Guild A' AND archived_at IS NULL")).rows[0];
  const raid = (await client.query("SELECT id FROM raid_events WHERE guild_id=$1 AND name='E2E Molten Core'", [guild.id])).rows[0];
  const members = (await client.query("SELECT id,character_name FROM guild_members WHERE guild_id=$1 AND character_name LIKE 'E2E Character %'", [guild.id])).rows;
  const users = (await client.query("SELECT id,email FROM users WHERE email LIKE 'e2e-%@prepull.test'")).rows;
  return { guildId: guild.id as string, raidId: raid.id as string, members: new Map<string, string>(members.map((row) => [row.character_name, row.id])), users: new Map<string, string>(users.map((row) => [row.email, row.id])) };
}

async function reset() {
  const client = await database();
  try {
    const fixture = await fixtureIds(client); const userIds = [...fixture.users.values()]; const memberIds = [...fixture.members.values()];
    await client.query("DELETE FROM audit_events WHERE guild_id=$1 AND action LIKE 'readiness.%'", [fixture.guildId]);
    await client.query("DELETE FROM guild_readiness_shares WHERE user_id=ANY($1::uuid[])", [userIds]);
    await client.query("DELETE FROM user_characters WHERE user_id=ANY($1::uuid[])", [userIds]);
    await client.query("DELETE FROM guild_member_links WHERE guild_member_id=ANY($1::uuid[])", [memberIds]);
    await client.query("INSERT INTO guild_member_links(guild_member_id,user_id,status,verification_method) VALUES($1,$2,'approved','officer-verified'),($3,$4,'pending','officer-verified')", [fixture.members.get("E2E Character 1"), fixture.users.get("e2e-member-a@prepull.test"), fixture.members.get("E2E Character 3"), fixture.users.get("e2e-member-b@prepull.test")]);
    await client.query("DELETE FROM raid_roster_entries WHERE raid_event_id=$1", [fixture.raidId]);
    for (const [name, state, group, role] of [["E2E Character 1", "selected", "Group 1", "DPS"], ["E2E Character 2", "selected", "Group 1", "DPS"], ["E2E Character 3", "selected", "Group 2", "Healer"], ["E2E Character 4", "bench", null, ""]] as const) await client.query("INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,group_name,role_name) VALUES($1,$2,$3,$4,$5)", [fixture.raidId, fixture.members.get(name), state, group, role]);
  } finally { await client.end(); }
}

async function saveAndShare(client: Client, fixture: Awaited<ReturnType<typeof fixtureIds>>, email: string, memberName: string, character: NormalizedCharacter, withSync = true) {
  const userId = fixture.users.get(email)!; const memberId = fixture.members.get(memberName)!;
  await client.query("INSERT INTO guild_member_links(guild_member_id,user_id,status,verification_method) VALUES($1,$2,'approved','officer-verified') ON CONFLICT(guild_member_id,user_id) DO UPDATE SET status='approved'", [memberId, userId]);
  const saved = (await client.query(`INSERT INTO user_characters(user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,is_primary) VALUES($1,'eu','firemaw','Firemaw',$2,regexp_replace(lower($2),'[^a-z0-9]+','-','g'),'era','era',$3,60,$4,$5,false) RETURNING id`, [userId, memberName, character.class, character.race, character.faction])).rows[0];
  await client.query("INSERT INTO guild_readiness_shares(guild_id,guild_member_id,user_id,user_character_id) VALUES($1,$2,$3,$4)", [fixture.guildId, memberId, userId, saved.id]);
  if (!withSync) return;
  const syncId = randomUUID();
  await client.query("INSERT INTO character_syncs(id,user_character_id,level,class_name,spec,race,faction,professions,talents,content_version,character_realm_type,provider,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'era','era','mock','success')", [syncId, saved.id, character.level, character.class, character.spec, character.race, character.faction, JSON.stringify(character.professions), JSON.stringify(character.talents ?? [])]);
  for (const item of character.equipment) await client.query(`INSERT INTO character_sync_items(sync_id,slot,item_id,item_name,item_level,quality,icon,stats,enchantments,weapon,set_id,special_effect_id,unique_group,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [syncId, item.slot, item.itemId || null, item.name, item.itemLevel ?? null, item.quality, item.icon, JSON.stringify(item.stats), JSON.stringify(item.enchantments ?? []), item.weapon ? JSON.stringify(item.weapon) : null, item.setId ?? null, item.specialEffectId ?? null, item.uniqueGroup ?? null, item.source ? JSON.stringify(item.source) : null]);
}

async function setupBoard() {
  const client = await database();
  try {
    const fixture = await fixtureIds(client);
    await client.query("DELETE FROM raid_roster_entries WHERE raid_event_id=$1", [fixture.raidId]);
    for (let index = 1; index <= 10; index++) await client.query("INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,group_name,role_name) VALUES($1,$2,$3,$4,$5)", [fixture.raidId, fixture.members.get(`E2E Character ${index}`), index === 10 ? "bench" : "selected", index === 10 ? null : `Group ${Math.ceil(index / 5)}`, index === 5 ? "Healer" : "DPS"]);
    await saveAndShare(client, fixture, "e2e-member-a@prepull.test", "E2E Character 1", eraFuryFixtures.fresh60);
    await saveAndShare(client, fixture, "e2e-member-b@prepull.test", "E2E Character 2", eraFrostMageFixtures.fresh60);
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 3", eraCombatRogueFixtures.fresh60);
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 4", eraMarksmanshipHunterFixtures.fresh60);
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 5", eraHolyPriestFixtures.fresh60);
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 6", eraFuryFixtures.fresh60, false);
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 7", { ...eraFrostMageFixtures.fresh60, spec: "Fire" });
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 9", eraFuryFixtures.nearBis);
    await saveAndShare(client, fixture, "e2e-owner@prepull.test", "E2E Character 10", eraFrostMageFixtures.fresh60);
    return fixture;
  } finally { await client.end(); }
}

test.beforeEach(reset);
test.afterEach(reset);

test("officer opens a multi-spec Prep Board with accurate selected activity counts", async ({ page }) => {
  const fixture = await setupBoard(); await signIn(page, "e2e-officer@prepull.test");
  await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}`);
  await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/readiness`);
  await page.getByRole("link", { name: "View Prep Board" }).click();
  await expect(page).toHaveURL(new RegExp(`/raids/${fixture.raidId}/prep$`));
  const summary = page.getByRole("region", { name: "Selected roster summary" });
  for (const value of ["Selected9", "Sharing readiness8", "Supported current data6", "With realistic opportunities5", "Need refresh1", "Recommendations unavailable1", "Not sharing1", "No strong Pre-Raid opportunities1"]) await expect(summary).toContainText(value);
  expect(await page.locator("details.panel").count()).toBeGreaterThan(2);
  const brd = page.locator("details.panel").filter({ hasText: "Blackrock Depths" }).first();
  await expect(brd).toContainText("4 selected players"); await expect(brd).toContainText("13 realistic opportunities");
  await brd.getByText("View players").click();
  await expect(brd.getByText("E2E Character 5")).toBeVisible(); await expect(brd.getByText("5 opportunities")).toBeVisible();
  await expect(page.getByText("Needs character refresh: 1")).toBeVisible();
  await expect(page.getByText("Recommendations unavailable for this specialization: 1")).toBeVisible();
  await expect(page.getByText("Bench excluded from selected totals (1)")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/E2E Character 10|@prepull\.test|Session Planner|Current equipment|user_character|Savage Gladiator Chain/i);
  await expect(page.getByRole("link", { name: "Back to Raid Readiness" })).toBeVisible(); await expect(page.getByRole("link", { name: "Back to Raid", exact: true })).toBeVisible();
});

test("Prep Board authorization follows assigned-leader and cross-guild rules", async ({ page }) => {
  const fixture = await setupBoard();
  await signIn(page, "e2e-assigned-leader@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`); await expect(page.getByRole("heading", { name: "E2E Molten Core prep" })).toBeVisible();
  await page.context().clearCookies(); await signIn(page, "e2e-unassigned-leader@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`); await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible();
  await page.context().clearCookies(); await signIn(page, "e2e-member-a@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`); await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible();
  await page.context().clearCookies(); await signIn(page, "e2e-guild-b-owner@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`); await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible(); await expect(page.locator("body")).not.toContainText("E2E Character 1");
});

test("disabled consent disappears from every derived activity immediately", async ({ page }) => {
  const fixture = await setupBoard(); await signIn(page, "e2e-officer@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`);
  let brd = page.locator("details.panel").filter({ hasText: "Blackrock Depths" }).first(); await expect(brd).toContainText("4 selected players");
  const client = await database(); await client.query("UPDATE guild_readiness_shares SET enabled=false,disabled_at=now() WHERE guild_member_id=$1", [fixture.members.get("E2E Character 1")]); await client.end();
  await page.reload(); brd = page.locator("details.panel").filter({ hasText: "Blackrock Depths" }).first(); await expect(brd).toContainText("3 selected players");
  await brd.getByText("View players").click(); await expect(brd).not.toContainText("E2E Character 1"); await expect(page.getByRole("region", { name: "Selected roster summary" })).toContainText("Sharing readiness7");
});

test("Prep Board is mobile, keyboard, and axe safe", async ({ page }) => {
  const fixture = await setupBoard(); await page.setViewportSize({ width: 390, height: 844 }); await signIn(page, "e2e-owner@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.keyboard.press("Tab"); await expect(page.locator(":focus")).toBeVisible();
  const activity = page.locator("details.panel").first().locator("summary"); await activity.focus(); await page.keyboard.press("Enter"); await expect(activity.locator("..")).toHaveAttribute("open", "");
  const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), JSON.stringify(result.violations)).toEqual([]);
});
