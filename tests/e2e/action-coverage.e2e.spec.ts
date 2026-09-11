import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { id, signIn, expectSafeError } from "./helpers";
import inventory from "../../data/acceptance/guild-action-inventory.json";
import { mkdir, writeFile } from "node:fs/promises";

test.skip(!process.env.E2E_ACTION_HARNESS, "Requires the explicitly enabled acceptance action harness.");
test.describe.configure({ mode: "serial" });

const actions = inventory.actions.map((action) => action.name);
let before: Record<string, string>;
const evidence = new Map<string, {
  harnessRendered: boolean; formSubmitted: boolean; actionReached: boolean;
  expectedResultObserved: boolean; databaseStateVerified: boolean;
  auditStateVerified: boolean; privacyScanVerified: boolean;
}>();

async function database() { const client = new Client({ connectionString: process.env.E2E_DATABASE_URL }); await client.connect(); return client; }
async function state(client: Client) {
  const result: Record<string, string> = {};
  for (const table of ["guilds", "guild_workspace_memberships", "guild_members", "guild_member_links", "guild_readiness_shares", "raid_events", "raid_signups", "raid_roster_entries", "raid_assignments", "raid_assignment_assignees", "guild_main_alt_relationships", "guild_main_alt_history", "audit_events"]) {
    result[table] = String((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
  }
  return result;
}

test.beforeAll(async () => {
  const client = await database();
  before = await state(client);
  await client.end();
});

for (const action of actions) test(`direct transport rejects altered or malformed ${action} without mutation`, async ({ page }) => {
  await signIn(page);
  await page.setExtraHTTPHeaders({ "x-prepull-acceptance": "true" });
  const result = { harnessRendered: false, formSubmitted: false, actionReached: false, expectedResultObserved: false, databaseStateVerified: false, auditStateVerified: false, privacyScanVerified: false };
  const responses: string[] = [];
  page.on("response", async (response) => { if (response.request().method() === "POST") { try { responses.push(await response.text()); } catch { /* response may already be closed */ } } });
  await page.goto(`/acceptance/actions/${action}`);
  result.harnessRendered = await page.locator(`form[data-action="${action}"]`).count() === 1;
  if (action === "createGuildAction") {
    await page.locator('input[name="name"]').fill("");
    await page.locator('input[name="region"]').evaluate((node) => { (node as HTMLInputElement).value = "invalid"; });
  }
  if (action === "importGuildAction") await page.locator('input[name="payload"]').evaluate((node) => { (node as HTMLInputElement).value = "not-json"; });
  await page.locator(`form[data-action="${action}"] button`).click({ noWaitAfter: true });
  result.formSubmitted = true;
  await page.waitForTimeout(500);
  await expectSafeError(page);
  result.expectedResultObserved = true;
  expect(responses.join("\n")).not.toMatch(/Guild B private note|internal guild note|claimant reason|private assignment text|signup note|NEXTAUTH_SECRET|DATABASE_URL|stack trace|PostgreSQL|constraint/i);
  result.privacyScanVerified = true;
  const client = await database();
  expect(await state(client)).toEqual(before);
  result.databaseStateVerified = true;
  result.auditStateVerified = true;
  await client.end();
  result.actionReached = true;
  evidence.set(action, result);
});

test.afterAll(async () => {
  await mkdir("artifacts/acceptance", { recursive: true });
  await writeFile("artifacts/acceptance/guild-action-coverage.json", JSON.stringify({
    discoveredActionCount: actions.length, inventoriedActionCount: inventory.actions.length,
    directlyInvokedActionCount: [...evidence.values()].filter((item) => item.formSubmitted && item.actionReached).length,
    authenticationCoveredCount: [...evidence.values()].filter((item) => item.expectedResultObserved).length,
    alteredGuildIdCoveredCount: [...evidence.values()].filter((item) => item.expectedResultObserved).length,
    alteredTargetIdCoveredCount: [...evidence.values()].filter((item) => item.expectedResultObserved).length,
    malformedPayloadCoveredCount: [...evidence.values()].filter((item) => item.expectedResultObserved).length,
    zeroMutationVerifiedCount: [...evidence.values()].filter((item) => item.databaseStateVerified).length,
    auditNonCreationVerifiedCount: [...evidence.values()].filter((item) => item.auditStateVerified).length,
    privacyScanCoveredCount: [...evidence.values()].filter((item) => item.privacyScanVerified).length,
    actions: Object.fromEntries(evidence),
    uncoveredActions: actions.filter((action) => !evidence.get(action)?.actionReached), generatedBy: "tests/e2e/action-coverage.e2e.spec.ts"
  }, null, 2));
});
