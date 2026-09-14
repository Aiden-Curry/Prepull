import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { instantToGuildLocalInput } from "../../lib/guilds/time";
import { base, signIn } from "./helpers";

const databaseUrl = () => process.env.E2E_DATABASE_URL ?? "postgres://prepull:prepull-test-only@localhost:5433/prepull_test";
type Fixture = { guildId: string; raidId: string; scheduledFor: string; originalTimeZone: string };

async function database() { const client = new Client({ connectionString: databaseUrl() }); await client.connect(); return client; }
async function createFixture(): Promise<Fixture> {
  const client = await database();
  try {
    const context = (await client.query("SELECT guild.id,guild.raid_timezone,membership.id AS membership_id FROM guilds guild JOIN guild_workspace_memberships membership ON membership.guild_id=guild.id JOIN users ON users.id=membership.user_id WHERE guild.name='E2E Guild A' AND users.email=$1 AND membership.active=true", [base.email])).rows[0];
    const raidId = randomUUID();
    const raid = (await client.query("INSERT INTO raid_events(id,guild_id,name,instance,starts_at,duration_minutes,status) VALUES($1,$2,'Unified Calendar Raid','Molten Core',date_trunc('day',now())+interval '2 days 17 hours',180,'open') RETURNING starts_at", [raidId, context.id])).rows[0];
    await client.query("INSERT INTO guild_prep_runs(guild_id,raid_id,activity_key,activity_label,activity_category,scheduled_for,status,created_by_membership_id) VALUES($1,$2,'unified:scheduled','Unified Calendar Prep','dungeon',date_trunc('day',now())+interval '3 days 18 hours','open',$3),($1,$2,'unified:unscheduled','Unscheduled Calendar Prep','dungeon',NULL,'open',$3)", [context.id, raidId, context.membership_id]);
    await client.query("UPDATE guilds SET raid_timezone='Europe/Oslo' WHERE id=$1", [context.id]);
    return { guildId: context.id, raidId, scheduledFor: new Date(raid.starts_at).toISOString(), originalTimeZone: context.raid_timezone };
  } finally { await client.end(); }
}
async function cleanup(fixture: Fixture | undefined) { if (!fixture) return; const client = await database(); try { await client.query("DELETE FROM raid_events WHERE id=$1 AND guild_id=$2", [fixture.raidId, fixture.guildId]); await client.query("UPDATE guilds SET raid_timezone=$1 WHERE id=$2", [fixture.originalTimeZone, fixture.guildId]); } finally { await client.end(); } }
async function setTimeZone(guildId: string, zone: string) { const client = await database(); try { await client.query("UPDATE guilds SET raid_timezone=$1 WHERE id=$2", [zone, guildId]); } finally { await client.end(); } }

let fixture: Fixture | undefined;
test.beforeEach(async () => { fixture = await createFixture(); });
test.afterEach(async () => { await cleanup(fixture); fixture = undefined; });

test("member sees game, raid, Prep Run, filters, region isolation, timezone changes, and version switching", async ({ page }) => {
  const current = fixture!; await signIn(page); await page.goto(`/era/guilds/${current.guildId}`);
  await page.getByRole("navigation", { name: "Guild workspace navigation" }).getByRole("link", { name: "Calendar" }).click();
  await expect(page).toHaveURL(new RegExp(`/era/guilds/${current.guildId}/calendar\\?region=eu$`));
  await expect(page.getByRole("heading", { name: "Calendar", exact: true })).toBeVisible();
  await expect(page.getByText("Game", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Guild Raid", { exact: true })).toBeVisible();
  await expect(page.getByText("Prep Run", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Unified Calendar Raid", { exact: true })).toBeVisible();
  await expect(page.getByText("Unified Calendar Prep", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unscheduled Prep Runs" })).toBeVisible();
  await page.getByText("Source and verification").first().click();
  await expect(page.getByRole("link", { name: /View source/ }).first()).toBeVisible();

  await page.getByRole("button", { name: "Guild", exact: true }).click();
  await expect(page.getByText("Unified Calendar Raid", { exact: true })).toBeVisible();
  await expect(page.getByText("Game", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Holidays" }).click();
  await expect(page.getByText("Hallow's End", { exact: true })).toBeVisible();
  await expect(page.getByText("Unified Calendar Raid", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "All", exact: true }).click();

  const oslo = instantToGuildLocalInput(current.scheduledFor, "Europe/Oslo").localTime;
  await expect(page.getByText(oslo, { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "US" }).click();
  await expect(page).toHaveURL(new RegExp(`/era/guilds/${current.guildId}/calendar\\?region=us$`));
  await expect(page.getByText("Unified Calendar Raid", { exact: true })).toBeVisible();
  await expect(page.getByText(oslo, { exact: true }).first()).toBeVisible();

  await setTimeZone(current.guildId, "America/New_York"); await page.reload();
  const newYork = instantToGuildLocalInput(current.scheduledFor, "America/New_York").localTime;
  await expect(page.getByText(newYork, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Arathi Basin Bonus Weekend|Alterac Valley Bonus Weekend|Warsong Gulch Bonus Weekend/).first()).toBeVisible();

  await page.getByRole("button", { name: "TBC", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/tbc/guilds/${current.guildId}/calendar\\?region=us$`));
  await expect(page.getByText("Unified Calendar Raid", { exact: true })).toBeVisible();
  await expect(page.getByText("Brewfest", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Game Calendar" })).toHaveAttribute("href", "/tbc/calendar?region=us");
});

test("unified route is membership-protected and exact TBC callback is restored", async ({ browser, page }) => {
  const current = fixture!; const callback = `/tbc/guilds/${current.guildId}/calendar?region=eu`;
  await page.goto(callback); expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(callback);
  await page.getByLabel("Email").fill(base.email); await page.getByLabel("Password").fill(base.password); await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`/tbc/guilds/${current.guildId}/calendar\\?region=eu$`));
  const context = await browser.newContext(); const outsider = await context.newPage(); await signIn(outsider, "e2e-guild-b-owner@prepull.test"); await outsider.goto(`/era/guilds/${current.guildId}/calendar?region=eu`);
  await expect(outsider.getByText("Unified Calendar Raid", { exact: true })).toHaveCount(0); await context.close();
});

test("unified calendar is mobile, keyboard, and axe safe", async ({ page }) => {
  const current = fixture!; await signIn(page, "e2e-member-a@prepull.test"); await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`/era/guilds/${current.guildId}/calendar?region=eu`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  const all = page.getByRole("button", { name: "All", exact: true }); await all.focus(); await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Guild", exact: true })).toBeFocused();
  const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), JSON.stringify(axe.violations)).toEqual([]);
});
