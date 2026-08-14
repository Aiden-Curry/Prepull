import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { id, signIn, expectSafeError } from "./helpers";

async function database() { const client = new Client({ connectionString: process.env.E2E_DATABASE_URL }); await client.connect(); return client; }

test("unauthenticated guild creation form is rejected without a database mutation", async ({ page }) => {
  await signIn(page);
  await page.goto("/era/guilds");
  const client = await database();
  const before = Number((await client.query("SELECT count(*)::int AS count FROM guilds WHERE name=$1", ["Unauthenticated Action Probe"])).rows[0].count);
  await page.context().clearCookies();
  await page.getByRole("textbox", { name: "Guild name" }).fill("Unauthenticated Action Probe");
  await page.getByRole("textbox", { name: "Realm name" }).fill("Firemaw");
  await page.getByRole("textbox", { name: "Realm slug" }).fill("firemaw");
  await page.getByRole("button", { name: "Create guild" }).click();
  await page.waitForTimeout(500);
  const after = Number((await client.query("SELECT count(*)::int AS count FROM guilds WHERE name=$1", ["Unauthenticated Action Probe"])).rows[0].count);
  await client.end();
  expect(after).toBe(before);
  await expectSafeError(page);
});

test("cross-guild role action rejects altered guild and target identifiers", async ({ page }) => {
  await signIn(page);
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/settings`);
  const client = await database();
  const target = (await client.query("SELECT user_id,role FROM guild_workspace_memberships WHERE guild_id=$1 AND role='member' LIMIT 1", [id("E2E_GUILD_B_ID")])).rows[0];
  const before = target.role;
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Save role" }) }).first();
  await form.locator("input[name=guildId]").evaluate((node, value) => { (node as HTMLInputElement).value = String(value); }, id("E2E_GUILD_B_ID"));
  await form.locator("input[name=targetUserId]").evaluate((node, value) => { (node as HTMLInputElement).value = String(value); }, target.user_id);
  await form.getByRole("button", { name: "Save role" }).click();
  await page.waitForTimeout(500);
  const after = (await client.query("SELECT role FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$2", [id("E2E_GUILD_B_ID"), target.user_id])).rows[0].role;
  const audit = Number((await client.query("SELECT count(*)::int AS count FROM audit_events WHERE guild_id=$1 AND action='membership.role-changed' AND actor_user_id IN (SELECT id FROM users WHERE email=$2)", [id("E2E_GUILD_B_ID"), "e2e-owner@prepull.test"])).rows[0].count);
  await client.end();
  expect(after).toBe(before);
  expect(audit).toBe(0);
  await expectSafeError(page);
});

test("member signup action rejects a raid identifier from another guild", async ({ page }) => {
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}`);
  const client = await database();
  const before = Number((await client.query("SELECT count(*)::int AS count FROM raid_signups WHERE raid_event_id=$1", [id("E2E_RAID_B_ID")])).rows[0].count);
  const form = page.getByRole("heading", { name: "Member signup" }).locator(".." ).locator("form");
  await form.locator("input[name=guildId]").evaluate((node, value) => { (node as HTMLInputElement).value = String(value); }, id("E2E_GUILD_B_ID"));
  await form.locator("input[name=eventId]").evaluate((node, value) => { (node as HTMLInputElement).value = String(value); }, id("E2E_RAID_B_ID"));
  await form.getByRole("button", { name: "Save my signup" }).click();
  await page.waitForTimeout(500);
  const after = Number((await client.query("SELECT count(*)::int AS count FROM raid_signups WHERE raid_event_id=$1", [id("E2E_RAID_B_ID")])).rows[0].count);
  await client.end();
  expect(after).toBe(before);
  await expectSafeError(page);
});

test("cross-guild claim review rejects an altered guild identifier", async ({ page }) => {
  await signIn(page);
  await page.goto(`/era/guilds/${id("E2E_GUILD_A_ID")}/settings`);
  const client = await database();
  const claim = (await client.query("SELECT l.id,l.status FROM guild_member_links l JOIN guild_members m ON m.id=l.guild_member_id WHERE m.guild_id=$1 AND l.status='pending' LIMIT 1", [id("E2E_GUILD_A_ID")])).rows[0];
  const form = page.getByRole("button", { name: "Approve" }).first().locator(".." );
  await form.locator("input[name=guildId]").evaluate((node, value) => { (node as HTMLInputElement).value = String(value); }, id("E2E_GUILD_B_ID"));
  await form.getByRole("button", { name: "Approve" }).click();
  await page.waitForTimeout(500);
  const after = (await client.query("SELECT status FROM guild_member_links WHERE id=$1", [claim.id])).rows[0].status;
  const audit = Number((await client.query("SELECT count(*)::int AS count FROM audit_events WHERE guild_id=$1 AND entity_id=$2 AND action='claim.approved'", [id("E2E_GUILD_B_ID"), claim.id])).rows[0].count);
  await client.end();
  expect(after).toBe(claim.status);
  expect(audit).toBe(0);
  await expectSafeError(page);
});
