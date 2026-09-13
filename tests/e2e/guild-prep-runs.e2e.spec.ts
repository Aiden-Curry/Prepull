import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { eraFuryFixtures } from "../../lib/gear-analysis/fixtures";
import { signIn, submitServerAction } from "./helpers";

const databaseUrl = () =>
  process.env.E2E_DATABASE_URL ??
  "postgres://prepull:prepull-test-only@localhost:5433/prepull_test";
async function database() {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  return client;
}

async function fixtureIds(client: Client) {
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
  const member = (
    await client.query(
      "SELECT id FROM guild_members WHERE guild_id=$1 AND character_name='E2E Character 1'",
      [guild.id],
    )
  ).rows[0];
  const user = (
    await client.query(
      "SELECT id FROM users WHERE email='e2e-member-a@prepull.test'",
    )
  ).rows[0];
  return {
    guildId: guild.id as string,
    guildBId: guildB.id as string,
    raidId: raid.id as string,
    memberId: member.id as string,
    memberUserId: user.id as string,
  };
}

async function resetAndSetup() {
  const client = await database();
  try {
    const fixture = await fixtureIds(client);
    await client.query(
      "DELETE FROM guild_prep_runs WHERE guild_id=ANY($1::uuid[])",
      [[fixture.guildId, fixture.guildBId]],
    );
    await client.query(
      "DELETE FROM audit_events WHERE guild_id=$1 AND action LIKE 'prep_run.%'",
      [fixture.guildId],
    );
    await client.query("DELETE FROM guild_readiness_shares WHERE user_id=$1", [
      fixture.memberUserId,
    ]);
    await client.query(
      "UPDATE guilds SET raid_timezone='Europe/Oslo' WHERE id=$1",
      [fixture.guildId],
    );
    await client.query(
      "DELETE FROM character_sync_items WHERE sync_id IN (SELECT sync.id FROM character_syncs sync JOIN user_characters character ON character.id=sync.user_character_id WHERE character.user_id=$1)",
      [fixture.memberUserId],
    );
    await client.query(
      "DELETE FROM character_syncs WHERE user_character_id IN (SELECT id FROM user_characters WHERE user_id=$1)",
      [fixture.memberUserId],
    );
    await client.query("DELETE FROM user_characters WHERE user_id=$1", [
      fixture.memberUserId,
    ]);
    await client.query(
      "INSERT INTO guild_member_links(guild_member_id,user_id,status,verification_method) VALUES($1,$2,'approved','officer-verified') ON CONFLICT(guild_member_id,user_id) DO UPDATE SET status='approved'",
      [fixture.memberId, fixture.memberUserId],
    );
    await client.query(
      "DELETE FROM raid_roster_entries WHERE raid_event_id=$1",
      [fixture.raidId],
    );
    await client.query(
      "INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,group_name,role_name) VALUES($1,$2,'selected','Group 1','DPS')",
      [fixture.raidId, fixture.memberId],
    );
    const saved = (
      await client.query(
        `INSERT INTO user_characters(user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,is_primary) VALUES($1,'eu','firemaw','Firemaw','E2E Character 1','e2e-character-1','era','era','Warrior',60,'Orc','Horde',true) RETURNING id`,
        [fixture.memberUserId],
      )
    ).rows[0];
    const syncId = randomUUID(),
      character = eraFuryFixtures.fresh60;
    await client.query(
      "INSERT INTO character_syncs(id,user_character_id,level,class_name,spec,race,faction,professions,talents,content_version,character_realm_type,provider,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'era','era','mock','success')",
      [
        syncId,
        saved.id,
        character.level,
        character.class,
        character.spec,
        character.race,
        character.faction,
        JSON.stringify(character.professions),
        JSON.stringify(character.talents ?? []),
      ],
    );
    for (const item of character.equipment)
      await client.query(
        `INSERT INTO character_sync_items(sync_id,slot,item_id,item_name,item_level,quality,icon,stats,enchantments,weapon,set_id,special_effect_id,unique_group,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          syncId,
          item.slot,
          item.itemId || null,
          item.name,
          item.itemLevel ?? null,
          item.quality,
          item.icon,
          JSON.stringify(item.stats),
          JSON.stringify(item.enchantments ?? []),
          item.weapon ? JSON.stringify(item.weapon) : null,
          item.setId ?? null,
          item.specialEffectId ?? null,
          item.uniqueGroup ?? null,
          item.source ? JSON.stringify(item.source) : null,
        ],
      );
    await client.query(
      "INSERT INTO guild_readiness_shares(guild_id,guild_member_id,user_id,user_character_id) VALUES($1,$2,$3,$4)",
      [fixture.guildId, fixture.memberId, fixture.memberUserId, saved.id],
    );
    return fixture;
  } finally {
    await client.end();
  }
}

async function createPersistedRun(
  fixture: Awaited<ReturnType<typeof resetAndSetup>>,
) {
  const client = await database();
  try {
    return (
      await client.query(
        `INSERT INTO guild_prep_runs(guild_id,raid_id,activity_key,activity_label,activity_category,created_by_membership_id,note)
      SELECT $1,$2,'dungeon:blackrock-depths','Blackrock Depths','dungeon',id,'Optional guild preparation run' FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=(SELECT id FROM users WHERE email='e2e-officer@prepull.test') RETURNING id`,
        [fixture.guildId, fixture.raidId],
      )
    ).rows[0].id as string;
  } finally {
    await client.end();
  }
}

test.beforeEach(async () => {
  await resetAndSetup();
});
test.afterEach(async () => {
  const client = await database();
  try {
    const fixture = await fixtureIds(client);
    await client.query(
      "DELETE FROM guild_prep_runs WHERE guild_id=ANY($1::uuid[])",
      [[fixture.guildId, fixture.guildBId]],
    );
  } finally {
    await client.end();
  }
});

test("organizer creates a canonical run and member RSVP remains after readiness consent is revoked", async ({
  page,
}) => {
  test.setTimeout(45_000);
  const client = await database();
  const fixture = await fixtureIds(client);
  await client.end();
  await signIn(page, "e2e-officer@prepull.test");
  await page.goto(
    `/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`,
  );
  const brd = page
    .locator("details.panel")
    .filter({ hasText: "Blackrock Depths" })
    .first();
  await brd.getByText("View players").click();
  await brd.getByLabel("Optional date").fill("2030-09-20");
  await brd.getByLabel("Optional time").fill("19:00");
  await brd.getByLabel("Optional note").fill("Optional BRD guild run");
  await brd.getByRole("button", { name: "Create Prep Run" }).click();
  await page.waitForURL(/\/guilds\/[^/]+\/prep\/[^?]+$/);
  const runUrl = page.url();
  await expect(
    page.getByRole("heading", { name: "Blackrock Depths Prep Run" }),
  ).toBeVisible();
  await expect(page.getByText("Optional BRD guild run")).toBeVisible();
  await expect(page.getByText(/19:00 \(Europe\/Oslo\)/)).toBeVisible();
  await page.goto(`/era/guilds/${fixture.guildId}/schedule`);
  await expect(
    page.getByRole("heading", { name: "Guild Schedule" }),
  ).toBeVisible();
  await expect(page.getByText("Blackrock Depths")).toBeVisible();
  await expect(page.getByText("19:00", { exact: true })).toBeVisible();
  await page.goto(`/era/guilds/${fixture.guildId}`);
  await expect(page.getByRole("heading", { name: "Up next" })).toBeVisible();
  await expect(
    page.getByText("Blackrock Depths", { exact: true }),
  ).toBeVisible();
  const verify = await database();
  assertZero(
    await verify
      .query(
        "SELECT count(*)::int AS count FROM guild_prep_run_signups WHERE prep_run_id=$1",
        [runUrl.split("/").at(-1)],
      )
      .then((result) => result.rows[0].count),
  );
  await verify.end();
  await page.context().clearCookies();
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(`/era/guilds/${fixture.guildId}/prep`);
  await page.getByRole("link", { name: "View Prep Run" }).click();
  await expect(
    page.getByText(
      "This activity currently has useful opportunities for your shared character.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Going" }).click();
  await page.waitForURL(/prepNotice=/);
  await expect(page.getByText(/Current response:/).locator("..")).toContainText(
    "going",
  );
  await page.goto("/era/profile");
  await submitServerAction(
    page,
    page.getByRole("button", { name: "Stop sharing" }),
  );
  await page.goto(runUrl);
  await expect(
    page.getByText(
      "This activity currently has useful opportunities for your shared character.",
    ),
  ).toHaveCount(0);
  await expect(page.getByText(/Current response:/).locator("..")).toContainText(
    "going",
  );
  await page.context().clearCookies();
  await signIn(page, "e2e-officer@prepull.test");
  await page.goto(runUrl);
  const organizer = page.getByRole("region", { name: "Organizer controls" });
  await expect(
    organizer.getByText("May benefit", { exact: true }).locator(".."),
  ).toContainText("0");
  await expect(
    page.getByRole("region", { name: "Participants" }),
  ).toContainText("E2E memberA");
  await organizer.getByLabel("Optional time").fill("20:30");
  await organizer.getByRole("button", { name: "Save Prep Run" }).click();
  await page.waitForURL(/prepNotice=/);
  await expect(page.getByText(/20:30 \(Europe\/Oslo\)/)).toBeVisible();
  await page.context().clearCookies();
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(runUrl);
  await page.getByRole("button", { name: "Maybe" }).click();
  await page.waitForURL(/prepNotice=/);
  await expect(page.getByText(/Current response:/).locator("..")).toContainText(
    "maybe",
  );
  await page.getByRole("button", { name: "Leave" }).click();
  await page.waitForURL(/prepNotice=/);
  await expect(page.getByText(/Current response:/).locator("..")).toContainText(
    "Not responded",
  );
  await page.context().clearCookies();
  await signIn(page, "e2e-officer@prepull.test");
  await page.goto(runUrl);
  await page.getByLabel("Note").fill("Updated coordination note");
  await page.getByRole("button", { name: "Save Prep Run" }).click();
  await expect(page.getByRole("status")).toContainText("Prep Run updated");
  await expect(page.getByText("Updated coordination note")).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByText("Status:").locator("..")).toContainText(
    "completed",
  );
  await expect(page.getByText("Signup changes are closed.")).toBeVisible();
});

test("assigned leader may manage while ordinary, unassigned, and cross-guild members cannot", async ({
  page,
}) => {
  const client = await database();
  const fixture = await fixtureIds(client);
  await client.end();
  const runId = await createPersistedRun(fixture);
  const runPath = `/era/guilds/${fixture.guildId}/prep/${runId}`;
  await signIn(page, "e2e-assigned-leader@prepull.test");
  await page.goto(runPath);
  await expect(
    page.getByRole("heading", { name: "Organizer controls" }),
  ).toBeVisible();
  await page.context().clearCookies();
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(runPath);
  await expect(
    page.getByRole("heading", { name: "Organizer controls" }),
  ).toHaveCount(0);
  await expect(
    page.locator("input[name=membershipId], input[name=userId]"),
  ).toHaveCount(0);
  await page.context().clearCookies();
  await signIn(page, "e2e-unassigned-leader@prepull.test");
  await page.goto(
    `/era/guilds/${fixture.guildId}/raids/${fixture.raidId}/prep`,
  );
  await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible();
  await page.context().clearCookies();
  await signIn(page, "e2e-guild-b-owner@prepull.test");
  await page.goto(runPath);
  await expect(page.getByText("404 / Lost in the dungeon")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /Blackrock Depths|Optional guild preparation run/,
  );
});

test("Prep Run list and detail are mobile, keyboard, and axe safe", async ({
  page,
}) => {
  const client = await database();
  const fixture = await fixtureIds(client);
  await client.end();
  const runId = await createPersistedRun(fixture);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "e2e-member-a@prepull.test");
  await page.goto(`/era/guilds/${fixture.guildId}/prep/${runId}`);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Going" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/prepNotice=/);
  await expect(page.getByText(/Current response:/).locator("..")).toContainText(
    "going",
  );
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    ),
    JSON.stringify(result.violations),
  ).toEqual([]);
});

function assertZero(value: number) {
  expect(value).toBe(0);
}
