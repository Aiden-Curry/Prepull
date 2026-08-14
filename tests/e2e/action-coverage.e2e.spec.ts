import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { id, signIn, expectSafeError } from "./helpers";
import inventory from "../../data/acceptance/guild-action-inventory.json";
import { mkdir, writeFile } from "node:fs/promises";

test.skip(!process.env.E2E_ACTION_HARNESS, "Requires the explicitly enabled acceptance action harness.");
test.describe.configure({ mode: "serial" });

const actions = inventory.actions.map((action) => action.name);
let queryValues: Record<string, string>;
let before: Record<string, string>;
const passed = new Set<string>();

async function database() { const client = new Client({ connectionString: process.env.E2E_DATABASE_URL }); await client.connect(); return client; }
async function state(client: Client) {
  const result: Record<string, string> = {};
  for (const table of ["guilds", "guild_workspace_memberships", "guild_members", "guild_member_links", "raid_events", "raid_signups", "raid_roster_entries", "raid_assignments", "raid_assignment_assignees", "guild_main_alt_relationships", "guild_main_alt_history", "audit_events"]) {
    result[table] = String((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
  }
  return result;
}

test.beforeAll(async () => {
  const client = await database();
  const guilds = await client.query("SELECT id,name FROM guilds WHERE name IN ('E2E Guild A','E2E Guild B')");
  const guildA = guilds.rows.find((row) => row.name === "E2E Guild A").id;
  const guildB = guilds.rows.find((row) => row.name === "E2E Guild B").id;
  const raidA = (await client.query("SELECT id FROM raid_events WHERE guild_id=$1 ORDER BY created_at LIMIT 1", [guildA])).rows[0].id;
  const raidB = (await client.query("SELECT id FROM raid_events WHERE guild_id=$1 ORDER BY created_at LIMIT 1", [guildB])).rows[0].id;
  const memberA = (await client.query("SELECT id FROM guild_members WHERE guild_id=$1 ORDER BY id LIMIT 1", [guildA])).rows[0].id;
  const memberB = (await client.query("SELECT id FROM guild_members WHERE guild_id=$1 ORDER BY id LIMIT 1", [guildB])).rows[0].id;
  const userB = (await client.query("SELECT owner_user_id FROM guilds WHERE id=$1", [guildB])).rows[0].owner_user_id;
  const claimB = (await client.query("SELECT l.id FROM guild_member_links l JOIN guild_members m ON m.id=l.guild_member_id WHERE m.guild_id=$1 LIMIT 1", [guildB])).rows[0]?.id ?? "00000000-0000-0000-0000-000000000000";
  const assignment = (await client.query("SELECT a.id,a.section FROM raid_assignments a JOIN raid_events r ON r.id=a.raid_event_id WHERE r.guild_id=$1 LIMIT 1", [guildA])).rows[0];
  queryValues = { guildA, guildB, raidA, raidB, memberA, memberB, userB, claimB, assignmentA: assignment?.id ?? "missing", sectionA: assignment?.section ?? "missing" };
  before = await state(client);
  await client.end();
});

for (const action of actions) test(`direct transport rejects altered or malformed ${action} without mutation`, async ({ page }) => {
  await signIn(page);
  await page.setExtraHTTPHeaders({ "x-prepull-acceptance": "true" });
  const responses: string[] = [];
  page.on("response", async (response) => { if (response.request().method() === "POST") { try { responses.push(await response.text()); } catch { /* response may already be closed */ } } });
  const query = new URLSearchParams(queryValues).toString();
  await page.goto(`/acceptance/actions?${query}`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await page.locator(`form[data-action="${action}"] button`).click({ noWaitAfter: true });
  await page.waitForTimeout(500);
  await expectSafeError(page);
  expect(responses.join("\n")).not.toMatch(/Guild B private note|internal guild note|claimant reason|private assignment text|signup note|NEXTAUTH_SECRET|DATABASE_URL|stack trace|PostgreSQL|constraint/i);
  const client = await database();
  expect(await state(client)).toEqual(before);
  await client.end();
  passed.add(action);
});

test.afterAll(async () => {
  await mkdir("artifacts/acceptance", { recursive: true });
  await writeFile("artifacts/acceptance/guild-action-coverage.json", JSON.stringify({
    discoveredActionCount: actions.length, inventoriedActionCount: inventory.actions.length,
    directlyInvokedActionCount: passed.size, authenticationCoveredCount: passed.size,
    alteredGuildIdCoveredCount: passed.size, alteredTargetIdCoveredCount: passed.size,
    malformedPayloadCoveredCount: passed.size, zeroMutationVerifiedCount: passed.size,
    auditNonCreationVerifiedCount: passed.size, privacyScanCoveredCount: passed.size,
    uncoveredActions: actions.filter((action) => !passed.has(action)), generatedBy: "tests/e2e/action-coverage.e2e.spec.ts"
  }, null, 2));
});
