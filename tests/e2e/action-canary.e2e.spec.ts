import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { signIn } from "./helpers";

test.skip(!process.env.E2E_ACTION_HARNESS, "Requires the explicitly enabled acceptance action harness.");

test("authenticated create-guild Server Action canary creates its owner", async ({ page }) => {
  const name = `Harness Canary ${Date.now()}`;
  await signIn(page);
  await page.goto("/acceptance/actions/createGuildAction");
  await page.locator('form[data-action="createGuildAction"] input[name="name"]').fill(name);
  await page.locator('form[data-action="createGuildAction"] button').click({ noWaitAfter: true });
  await page.waitForTimeout(750);

  const client = new Client({ connectionString: process.env.E2E_DATABASE_URL });
  await client.connect();
  const row = (await client.query(
    "SELECT g.id, g.owner_user_id, u.email FROM guilds g JOIN users u ON u.id=g.owner_user_id WHERE g.name=$1",
    [name],
  )).rows[0];
  await client.end();
  expect(row?.id).toBeTruthy();
  expect(row?.email).toBe("e2e-owner@prepull.test");
});
