import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { signIn, submitServerAction } from "./helpers";

const databaseUrl = () => process.env.E2E_DATABASE_URL ?? "postgres://prepull:prepull-test-only@localhost:5433/prepull_test";
async function database() { const client = new Client({ connectionString: databaseUrl() }); await client.connect(); return client; }
async function ids() {
  const client = await database(); try {
    const guild = (await client.query("SELECT id FROM guilds WHERE name='E2E Guild A' AND archived_at IS NULL")).rows[0];
    const raid = (await client.query("SELECT id FROM raid_events WHERE guild_id=$1 AND name='E2E Molten Core'", [guild.id])).rows[0];
    const members = (await client.query("SELECT id,character_name FROM guild_members WHERE guild_id=$1 AND character_name LIKE 'E2E Character %'", [guild.id])).rows;
    return { guildId: guild.id as string, raidId: raid.id as string, members: new Map<string, string>(members.map((row) => [row.character_name, row.id])) };
  } finally { await client.end(); }
}

async function reset() {
  const client = await database(); try {
    const fixture = await ids();
    const emails = ["e2e-owner@prepull.test", "e2e-member-a@prepull.test", "e2e-member-b@prepull.test"];
    await client.query("DELETE FROM audit_events WHERE guild_id=$1 AND action LIKE 'readiness.%'", [fixture.guildId]);
    await client.query("DELETE FROM guild_readiness_shares WHERE user_id IN (SELECT id FROM users WHERE email=ANY($1::text[]))", [emails]);
    await client.query("DELETE FROM character_sync_items WHERE sync_id IN (SELECT s.id FROM character_syncs s JOIN user_characters c ON c.id=s.user_character_id JOIN users u ON u.id=c.user_id WHERE u.email=ANY($1::text[]))", [emails]);
    await client.query("DELETE FROM character_syncs WHERE user_character_id IN (SELECT c.id FROM user_characters c JOIN users u ON u.id=c.user_id WHERE u.email=ANY($1::text[]))", [emails]);
    await client.query("DELETE FROM user_characters WHERE user_id IN (SELECT id FROM users WHERE email=ANY($1::text[]))", [emails]);
    await client.query("DELETE FROM guild_member_links WHERE guild_member_id=ANY($1::uuid[]) AND NOT (guild_member_id=$2 AND user_id=(SELECT id FROM users WHERE email='e2e-member-a@prepull.test')) AND NOT (guild_member_id=$3 AND user_id=(SELECT id FROM users WHERE email='e2e-member-b@prepull.test'))", [[...fixture.members.values()], fixture.members.get("E2E Character 1"), fixture.members.get("E2E Character 3")]);
    await client.query("UPDATE guild_member_links SET status=CASE WHEN guild_member_id=$1 THEN 'approved' ELSE 'pending' END WHERE guild_member_id=ANY($2::uuid[])", [fixture.members.get("E2E Character 1"), [fixture.members.get("E2E Character 1"), fixture.members.get("E2E Character 3")]]);
    await client.query("DELETE FROM raid_roster_entries WHERE raid_event_id=$1", [fixture.raidId]);
    for (const [name, state, group, role] of [["E2E Character 1", "selected", "Group 1", "DPS"], ["E2E Character 2", "selected", "Group 1", "DPS"], ["E2E Character 3", "selected", "Group 2", "Healer"], ["E2E Character 4", "bench", null, ""]] as const) await client.query("INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,group_name,role_name) VALUES($1,$2,$3,$4,$5)", [fixture.raidId, fixture.members.get(name), state, group, role]);
  } finally { await client.end(); }
}

async function saveCharacter(email: string, characterName: string, className = "Warrior") {
  const client = await database(); try {
    const result = await client.query(`INSERT INTO user_characters(user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,is_primary)
      SELECT id,'eu','firemaw','Firemaw',$2,regexp_replace(lower($2),'[^a-z0-9]+','-','g'),'era','era',$3,60,'Orc','Horde',true FROM users WHERE email=$1 RETURNING id`, [email, characterName, className]);
    return result.rows[0].id as string;
  } finally { await client.end(); }
}

async function approveAndShare(email: string, guildId: string, guildMemberId: string, userCharacterId: string, spec?: string) {
  const client = await database(); try {
    const user = (await client.query("SELECT id FROM users WHERE email=$1", [email])).rows[0];
    await client.query("INSERT INTO guild_member_links(guild_member_id,user_id,status,verification_method) VALUES($1,$2,'approved','officer-verified') ON CONFLICT(guild_member_id,user_id) DO UPDATE SET status='approved'", [guildMemberId, user.id]);
    await client.query("INSERT INTO guild_readiness_shares(guild_id,guild_member_id,user_id,user_character_id) VALUES($1,$2,$3,$4)", [guildId, guildMemberId, user.id, userCharacterId]);
    if (spec) {
      const sync = randomUUID();
      await client.query("INSERT INTO character_syncs(id,user_character_id,level,class_name,spec,race,faction,content_version,character_realm_type,provider,status) VALUES($1,$2,60,$3,$4,'Orc','Horde','era','era','mock','success')", [sync, userCharacterId, spec === "Fury" ? "Warrior" : "Mage", spec]);
      await client.query("INSERT INTO character_sync_items(sync_id,slot,item_id,item_name,quality,icon) VALUES($1,'Head',700000,'Fresh helm','Uncommon','ST')", [sync]);
    }
  } finally { await client.end(); }
}

async function setupOfficerStates() {
  const fixture = await ids();
  const supported = await saveCharacter("e2e-member-a@prepull.test", "E2E Character 1");
  const needsRefresh = await saveCharacter("e2e-member-b@prepull.test", "E2E Character 2");
  const unsupported = await saveCharacter("e2e-owner@prepull.test", "E2E Character 3", "Mage");
  await approveAndShare("e2e-member-a@prepull.test", fixture.guildId, fixture.members.get("E2E Character 1")!, supported, "Fury");
  await approveAndShare("e2e-member-b@prepull.test", fixture.guildId, fixture.members.get("E2E Character 2")!, needsRefresh);
  await approveAndShare("e2e-owner@prepull.test", fixture.guildId, fixture.members.get("E2E Character 3")!, unsupported, "Fire");
  const client = await database(); try {
    await client.query("UPDATE raid_roster_entries SET roster_state='selected',group_name='Group 2',role_name='DPS' WHERE raid_event_id=$1 AND guild_member_id=$2", [fixture.raidId, fixture.members.get("E2E Character 4")]);
    await client.query("INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,role_name) VALUES($1,$2,'bench','DPS')", [fixture.raidId, fixture.members.get("E2E Character 5")]);
  } finally { await client.end(); }
  return fixture;
}

test.beforeEach(reset);
test.afterEach(reset);

test("member explicitly enables and immediately disables readiness sharing", async ({ page }) => {
  await saveCharacter("e2e-member-a@prepull.test", "E2E Character 1");
  await signIn(page, "e2e-member-a@prepull.test"); await page.goto("/era/profile");
  await expect(page.getByRole("region", { name: "Readiness sharing" }).getByRole("heading", { name: "E2E Character 1" })).toBeVisible();
  await submitServerAction(page, page.getByRole("button", { name: "Share readiness" }));
  await expect(page.getByRole("button", { name: "Stop sharing" })).toBeVisible();
  await submitServerAction(page, page.getByRole("button", { name: "Stop sharing" }));
  await expect(page.getByRole("button", { name: "Share readiness" })).toBeVisible();
});

test("pending claims and mismatched saved characters cannot be shared", async ({ page }) => {
  await saveCharacter("e2e-member-b@prepull.test", "E2E Character 3");
  await signIn(page, "e2e-member-b@prepull.test"); await page.goto("/era/profile");
  await expect(page.getByText(/No saved character currently matches/)).toBeVisible(); await expect(page.getByRole("button", { name: "Share readiness" })).toHaveCount(0);
});

test("officer sees factual selected summary and a separate bench without private data", async ({ page }) => {
  const fixture = await setupOfficerStates(); await signIn(page, "e2e-officer@prepull.test");
  await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/readiness`);
  const summary = page.getByRole("region", { name: "Selected roster summary" });
  await expect(summary).toContainText("Selected4"); await expect(summary).toContainText("Sharing3"); await expect(summary).toContainText("Supported specs1"); await expect(summary).toContainText("Need refresh1"); await expect(summary).toContainText("Unsupported specs1"); await expect(summary).toContainText("Not sharing1");
  const selected = page.getByRole("region", { name: "Selected characters" });
  await expect(selected.getByRole("heading", { name: "E2E Character 1" })).toBeVisible(); await expect(selected.getByText("Shared · needs refresh")).toBeVisible(); await expect(selected.getByText("Shared · recommendations unavailable")).toBeVisible(); await expect(selected.getByText("No readiness shared for this character.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bench" })).toBeVisible(); await expect(page.getByRole("heading", { name: "E2E Character 5" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/@prepull\.test|Session Planner|Recent updates|Current equipment|user_character/i);
});

test("assigned raid leader has access while an unassigned raid leader does not", async ({ page }) => {
  const fixture = await setupOfficerStates(); await signIn(page, "e2e-assigned-leader@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/readiness`); await expect(page.getByRole("heading", { name: "E2E Molten Core" })).toBeVisible();
  await page.context().clearCookies(); await signIn(page, "e2e-unassigned-leader@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/readiness`); await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible();
});

test("another guild cannot discover readiness through the raid URL", async ({ page }) => {
  const fixture = await setupOfficerStates(); await signIn(page, "e2e-guild-b-owner@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/readiness`); await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible(); await expect(page.locator("body")).not.toContainText("E2E Character 1");
});

test("a member cannot disable another member's readiness share", async ({ page }) => {
  const fixture = await setupOfficerStates();
  const client = await database(); const otherShare = (await client.query("SELECT s.id FROM guild_readiness_shares s JOIN users u ON u.id=s.user_id WHERE s.guild_id=$1 AND u.email='e2e-member-b@prepull.test'", [fixture.guildId])).rows[0].id; await client.end();
  await signIn(page, "e2e-member-a@prepull.test"); await page.goto("/era/profile");
  const form = page.getByRole("button", { name: "Stop sharing" }).locator("..");
  await form.locator("input[name=shareId]").evaluate((node, value) => { (node as HTMLInputElement).value = String(value); }, otherShare);
  const response = page.waitForResponse((candidate) => candidate.request().method() === "POST" && candidate.url().startsWith(new URL(page.url()).origin));
  await form.getByRole("button", { name: "Stop sharing" }).click(); await response;
  const verify = await database(); const enabled = (await verify.query("SELECT enabled FROM guild_readiness_shares WHERE id=$1", [otherShare])).rows[0].enabled; await verify.end();
  expect(enabled).toBe(true);
});

test("raid readiness is mobile, keyboard, and axe safe", async ({ page }) => {
  const fixture = await setupOfficerStates(); await page.setViewportSize({ width: 390, height: 844 }); await signIn(page, "e2e-owner@prepull.test"); await page.goto(`/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/readiness`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.keyboard.press("Tab"); await expect(page.locator(":focus")).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), JSON.stringify(result.violations)).toEqual([]);
});
