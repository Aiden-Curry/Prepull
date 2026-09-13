import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { signIn, submitServerAction } from "./helpers";

const databaseUrl = () =>
  process.env.E2E_DATABASE_URL ??
  "postgres://prepull:prepull-test-only@localhost:5433/prepull_test";

async function database() {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  return client;
}

async function fixture(client: Client) {
  const guild = (
    await client.query(
      "SELECT id FROM guilds WHERE name='E2E Guild A' AND archived_at IS NULL",
    )
  ).rows[0];
  const guildB = (
    await client.query(
      "SELECT id FROM guilds WHERE name='E2E Guild B' AND archived_at IS NULL",
    )
  ).rows[0];
  const raid = (
    await client.query(
      "SELECT id FROM raid_events WHERE guild_id=$1 AND name='E2E Molten Core'",
      [guild.id],
    )
  ).rows[0];
  const officer = (
    await client.query(
      "SELECT id FROM users WHERE email='e2e-officer@prepull.test'",
    )
  ).rows[0];
  return {
    guildId: guild.id as string,
    guildBId: guildB.id as string,
    raidId: raid.id as string,
    officerId: officer.id as string,
  };
}

async function resetSchedule() {
  const client = await database();
  try {
    const ids = await fixture(client);
    await client.query(
      "DELETE FROM guild_prep_runs WHERE guild_id=$1 AND activity_key LIKE 'timezone:%'",
      [ids.guildId],
    );
    await client.query(
      "DELETE FROM raid_events WHERE guild_id=$1 AND name LIKE 'Timezone E2E%'",
      [ids.guildId],
    );
    await client.query("UPDATE guilds SET raid_timezone='UTC' WHERE id=$1", [
      ids.guildId,
    ]);
    await client.query(
      "UPDATE guild_workspace_memberships SET capabilities=capabilities - 'manage-settings' WHERE guild_id=$1 AND user_id=$2",
      [ids.guildId, ids.officerId],
    );
    await client.query(
      "DELETE FROM audit_events WHERE guild_id=$1 AND action='guild.timezone_changed'",
      [ids.guildId],
    );
    return ids;
  } finally {
    await client.end();
  }
}

async function grantOfficerSettings() {
  const client = await database();
  try {
    const ids = await fixture(client);
    await client.query(
      `UPDATE guild_workspace_memberships
          SET capabilities=capabilities || '["manage-settings"]'::jsonb
        WHERE guild_id=$1 AND user_id=$2`,
      [ids.guildId, ids.officerId],
    );
    return ids;
  } finally {
    await client.end();
  }
}

async function setTimezone(page: Page, guildId: string, zone: string) {
  await page.goto(`/era/guilds/${guildId}/settings`);
  await page.getByLabel("Timezone", { exact: true }).fill(zone);
  await submitServerAction(
    page,
    page.getByRole("button", { name: "Save timezone" }),
  );
  await page.reload();
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveValue(zone);
}

test.beforeEach(async () => {
  await resetSchedule();
});
test.afterEach(async () => {
  await resetSchedule();
});

test("authorized timezone changes persist and alter presentation without shifting stored raid instants", async ({
  page,
}) => {
  const ids = await grantOfficerSettings();
  await signIn(page, "e2e-officer@prepull.test");
  await setTimezone(page, ids.guildId, "Europe/London");

  const client = await database();
  try {
    const audit = (
      await client.query(
        "SELECT summary FROM audit_events WHERE guild_id=$1 AND action='guild.timezone_changed' ORDER BY created_at DESC LIMIT 1",
        [ids.guildId],
      )
    ).rows[0];
    expect(audit.summary).toEqual({
      previousTimeZone: "UTC",
      newTimeZone: "Europe/London",
    });
  } finally {
    await client.end();
  }

  await page.goto(`/era/guilds/${ids.guildId}`);
  await page.getByLabel("Event name").fill("Timezone E2E Raid");
  await page.getByLabel("Instance").fill("Molten Core");
  await page.getByLabel("Date", { exact: true }).fill("2030-07-15");
  await page.getByLabel("Time", { exact: true }).fill("19:00");
  await submitServerAction(
    page,
    page.getByRole("button", { name: "Create event" }),
  );

  const verify = await database();
  let raidId: string;
  try {
    const raid = (
      await verify.query(
        "SELECT id,starts_at FROM raid_events WHERE guild_id=$1 AND name='Timezone E2E Raid'",
        [ids.guildId],
      )
    ).rows[0];
    raidId = raid.id;
    expect(raid.starts_at.toISOString()).toBe("2030-07-15T18:00:00.000Z");
  } finally {
    await verify.end();
  }

  await page.goto(`/era/guilds/${ids.guildId}/schedule`);
  await expect(page.getByText("19:00", { exact: true })).toBeVisible();
  await setTimezone(page, ids.guildId, "Europe/Oslo");
  await page.goto(`/era/guilds/${ids.guildId}/schedule`);
  await expect(page.getByText("20:00", { exact: true })).toBeVisible();

  const unchanged = await database();
  try {
    expect(
      (
        await unchanged.query("SELECT starts_at FROM raid_events WHERE id=$1", [
          raidId!,
        ])
      ).rows[0].starts_at.toISOString(),
    ).toBe("2030-07-15T18:00:00.000Z");
  } finally {
    await unchanged.end();
  }

  await page.context().clearCookies();
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(`/era/guilds/${ids.guildId}/settings`);
  await expect(page.getByText("Europe/Oslo", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveCount(0);
});

async function insertScheduleFixtures() {
  const client = await database();
  try {
    const ids = await fixture(client);
    await client.query(
      "UPDATE guilds SET raid_timezone='Europe/London' WHERE id=$1",
      [ids.guildId],
    );
    const raid = (
      await client.query(
        `INSERT INTO raid_events(guild_id,name,instance,starts_at,duration_minutes,status)
         VALUES($1,'Timezone E2E Browser Raid','Molten Core','2030-07-15T18:00:00Z',180,'open')
         RETURNING id`,
        [ids.guildId],
      )
    ).rows[0];
    const run = (
      await client.query(
        `INSERT INTO guild_prep_runs(guild_id,raid_id,activity_key,activity_label,activity_category,status)
         VALUES($1,$2,'timezone:unscheduled','Blackrock Depths','dungeon','open') RETURNING id`,
        [ids.guildId, raid.id],
      )
    ).rows[0];
    return {
      ...ids,
      browserRaidId: raid.id as string,
      runId: run.id as string,
    };
  } finally {
    await client.end();
  }
}

async function scheduleText(
  browser: Browser,
  timeZoneId: string,
  guildId: string,
) {
  const context = await browser.newContext({ timezoneId: timeZoneId });
  try {
    const page = await context.newPage();
    await signIn(page, "e2e-member-a@prepull.test");
    await page.goto(`/era/guilds/${guildId}/schedule`);
    await expect(page.getByText("19:00", { exact: true })).toBeVisible();
    return await page.locator("main").innerText();
  } finally {
    await context.close();
  }
}

test("schedule is browser-timezone independent, versioned, private across guilds, mobile, keyboard and axe safe", async ({
  browser,
  page,
}) => {
  const ids = await insertScheduleFixtures();
  const [oslo, newYork] = await Promise.all([
    scheduleText(browser, "Europe/Oslo", ids.guildId),
    scheduleText(browser, "America/New_York", ids.guildId),
  ]);
  expect(oslo).toContain("19:00");
  expect(newYork).toContain("19:00");

  await signIn(page, "e2e-member-a@prepull.test");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tbc/guilds/${ids.guildId}/schedule`);
  await expect(
    page.getByRole("heading", { name: "Guild Schedule" }),
  ).toBeVisible();
  await expect(page.getByText("Europe/London", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Unscheduled Prep Runs" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBeTruthy();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    ),
    JSON.stringify(axe.violations),
  ).toEqual([]);

  await page.context().clearCookies();
  await signIn(page, "e2e-guild-b-owner@prepull.test");
  for (const path of [
    `/era/guilds/${ids.guildId}/schedule`,
    `/era/guilds/${ids.guildId}/raids/${ids.browserRaidId}`,
    `/era/guilds/${ids.guildId}/prep/${ids.runId}`,
  ]) {
    await page.goto(path);
    await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Blackrock Depths");
  }
});

test("signed-out TBC schedule sign-in returns to the TBC schedule", async ({
  page,
}) => {
  const ids = await insertScheduleFixtures();
  await page.goto(`/tbc/guilds/${ids.guildId}/schedule`);
  await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=/);
  await page.getByLabel("Email").fill("e2e-member-a@prepull.test");
  await page.getByLabel("Password").fill("e2e-only-password-not-production");
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`/tbc/guilds/${ids.guildId}/schedule`);
  await expect(
    page.getByRole("heading", { name: "Guild Schedule" }),
  ).toBeVisible();
});
