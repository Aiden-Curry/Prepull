import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

if (!process.env.TEST_DATABASE_URL) {
  test(
    "settings integration requires TEST_DATABASE_URL",
    { skip: true },
    () => {},
  );
} else {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.GUILD_REPOSITORY_DRIVER = "postgres";
  const { query, closePool } = await import("../lib/guilds/db.ts");
  const { PostgresGuildRepository } = await import(
    "../lib/guilds/postgres-repository.ts"
  );
  const { changeRole, deactivateMember } = await import(
    "../lib/guilds/security.ts"
  );
  const { setCapabilityOverride, getGuildSettings, updateGuildTimezone } =
    await import("../lib/guilds/settings.ts");
  const { getGuildSchedule } = await import("../lib/guilds/schedule.ts");
  const { submitClaim, decideClaim } = await import(
    "../lib/guilds/workflows.ts"
  );
  test.after(async () => {
    await closePool();
  });
  async function fixture() {
    const owner = randomUUID(),
      officer = randomUUID(),
      claimant = randomUUID();
    await query(
      "INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x','Owner'),($3,$4,'x','Officer'),($5,$6,'x','Claimant')",
      [owner, `${owner}@s`, officer, `${officer}@s`, claimant, `${claimant}@s`],
    );
    const repo = new PostgresGuildRepository();
    const guild = await repo.createGuild(owner, {
      name: `Settings ${owner.slice(0, 6)}`,
      region: "eu",
      realmSlug: "firemaw",
      realmName: "Firemaw",
      characterRealmType: "era",
      contentVersion: "era",
      faction: "Horde",
      description: "",
    });
    await query(
      "INSERT INTO guild_workspace_memberships(guild_id,user_id,role,capabilities) VALUES($1,$2,'officer',$3),($1,$4,'member',$5)",
      [
        guild.id,
        officer,
        JSON.stringify(["manage-permissions", "manage-roster"]),
        claimant,
        JSON.stringify(["manage-roster"]),
      ],
    );
    const member = await repo.addMember(owner, guild.id, {
      characterId: `char-${owner}`,
      characterName: "Claimant",
      className: "Warrior",
      spec: "Fury",
      level: 60,
      race: "Orc",
      faction: "Horde",
      realm: "Firemaw",
      region: "eu",
      realmType: "era",
      contentVersion: "era",
      role: "DPS",
      readiness: "unknown",
    });
    return { owner, officer, claimant, guild, member };
  }
  async function clean(f: any) {
    await query("UPDATE guilds SET archived_at=now() WHERE id=$1", [
      f.guild.id,
    ]);
    await query("DELETE FROM guild_member_links WHERE guild_member_id=$1", [
      f.member.id,
    ]);
    await query("DELETE FROM audit_events WHERE guild_id=$1", [f.guild.id]);
    await query("DELETE FROM guild_prep_runs WHERE guild_id=$1", [f.guild.id]);
    await query("DELETE FROM raid_events WHERE guild_id=$1", [f.guild.id]);
    await query("DELETE FROM guild_members WHERE guild_id=$1", [f.guild.id]);
    await query("DELETE FROM guild_workspace_memberships WHERE guild_id=$1", [
      f.guild.id,
    ]);
    await query("DELETE FROM guilds WHERE id=$1", [f.guild.id]);
    await query("DELETE FROM users WHERE id=ANY($1::uuid[])", [
      [f.owner, f.officer, f.claimant],
    ]);
  }
  test("role changes and inactive membership take effect immediately", async () => {
    const f = await fixture();
    try {
      await changeRole({ id: f.owner }, f.guild.id, f.officer, "raid-leader");
      assert.equal(
        (
          await query(
            "SELECT role FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$2",
            [f.guild.id, f.officer],
          )
        ).rows[0].role,
        "raid-leader",
      );
      await deactivateMember({ id: f.owner }, f.guild.id, f.officer);
      await assert.rejects(
        () => getGuildSettings({ id: f.officer }, f.guild.id),
        /active guild membership/i,
      );
    } finally {
      await clean(f);
    }
  });
  test("grant and revoke overrides are effective and audited", async () => {
    const f = await fixture();
    try {
      await setCapabilityOverride(
        { id: f.owner },
        f.guild.id,
        f.claimant,
        "manage-notes",
        "grant",
      );
      await setCapabilityOverride(
        { id: f.owner },
        f.guild.id,
        f.claimant,
        "manage-notes",
        "revoke",
      );
      const row = (
        await query(
          "SELECT capabilities,revoked_capabilities FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$2",
          [f.guild.id, f.claimant],
        )
      ).rows[0];
      assert.deepEqual(row.capabilities, ["manage-roster"]);
      assert.deepEqual(row.revoked_capabilities, ["manage-notes"]);
      assert.equal(
        (
          await query(
            "SELECT count(*)::int AS count FROM audit_events WHERE guild_id=$1 AND action='membership.capability-changed'",
            [f.guild.id],
          )
        ).rows[0].count,
        2,
      );
    } finally {
      await clean(f);
    }
  });
  test("claim submission is pending and self-approval is rejected", async () => {
    const f = await fixture();
    try {
      const claim = await submitClaim(
        { id: f.claimant },
        f.guild.id,
        f.member.id,
      );
      assert.equal(
        (
          await query(
            "SELECT status,verification_method FROM guild_member_links WHERE id=$1",
            [claim],
          )
        ).rows[0].status,
        "pending",
      );
      await assert.rejects(
        () =>
          decideClaim(
            { id: f.claimant },
            f.guild.id,
            claim,
            "approved",
            "self",
          ),
        /claimant|permission/i,
      );
      await decideClaim(
        { id: f.officer },
        f.guild.id,
        claim,
        "approved",
        "officer review",
      );
      assert.equal(
        (
          await query("SELECT status FROM guild_member_links WHERE id=$1", [
            claim,
          ])
        ).rows[0].status,
        "approved",
      );
    } finally {
      await clean(f);
    }
  });
  test("inactive roster characters cannot be approved and audit summaries are safe", async () => {
    const f = await fixture();
    try {
      const claim = await submitClaim(
        { id: f.claimant },
        f.guild.id,
        f.member.id,
      );
      await query("UPDATE guild_members SET active=false WHERE id=$1", [
        f.member.id,
      ]);
      await assert.rejects(
        () =>
          decideClaim(
            { id: f.officer },
            f.guild.id,
            claim,
            "approved",
            "inactive",
          ),
        /inactive roster/i,
      );
      const events = (
        await query(
          "SELECT summary::text FROM audit_events WHERE guild_id=$1",
          [f.guild.id],
        )
      ).rows;
      assert.ok(
        events.every(
          (event) => !/password|token|DATABASE_URL|SQL/i.test(event.summary),
        ),
      );
    } finally {
      await clean(f);
    }
  });
  test("guild timezone persists, is authorized and audited, and never shifts stored instants", async () => {
    const f = await fixture();
    try {
      const raid = await new PostgresGuildRepository().createRaid(
        f.owner,
        f.guild.id,
        {
          name: "Timezone Raid",
          instance: "Molten Core",
          startsAt: "2030-07-15T17:00:00Z",
          durationMinutes: 180,
        },
      );
      await updateGuildTimezone({ id: f.owner }, f.guild.id, "Europe/Oslo");
      assert.equal(
        (await new PostgresGuildRepository().getWorkspace(f.owner, f.guild.id))
          .guild.raidTimezone,
        "Europe/Oslo",
      );
      assert.equal(
        (
          await query("SELECT starts_at FROM raid_events WHERE id=$1", [
            raid.id,
          ])
        ).rows[0].starts_at.toISOString(),
        "2030-07-15T17:00:00.000Z",
      );
      const audit = (
        await query(
          "SELECT summary FROM audit_events WHERE guild_id=$1 AND action='guild.timezone_changed'",
          [f.guild.id],
        )
      ).rows[0].summary;
      assert.deepEqual(audit, {
        previousTimeZone: "UTC",
        newTimeZone: "Europe/Oslo",
      });
      await assert.rejects(
        () =>
          updateGuildTimezone({ id: f.claimant }, f.guild.id, "Europe/London"),
        /permission/i,
      );
      await assert.rejects(
        () => updateGuildTimezone({ id: f.owner }, f.guild.id, "UTC+2"),
        /valid IANA/i,
      );
      await assert.rejects(
        () => updateGuildTimezone({ id: f.owner }, randomUUID(), "UTC"),
        /membership|permission/i,
      );
    } finally {
      await clean(f);
    }
  });
  test("schedule is member-visible, cross-guild isolated, bounded, sorted by instant, and excludes past or closed activity", async () => {
    const f = await fixture();
    try {
      await updateGuildTimezone({ id: f.owner }, f.guild.id, "Europe/London");
      const futureRaid = randomUUID(),
        pastRaid = randomUUID(),
        scheduled = randomUUID(),
        unscheduled = randomUUID(),
        closed = randomUUID();
      await query(
        `INSERT INTO raid_events(id,guild_id,name,instance,starts_at,duration_minutes,status) VALUES
      ($1,$2,'Future Raid','Molten Core','2030-01-01T20:00:00Z',180,'open'),
      ($3,$2,'Past Raid','Molten Core','2020-01-01T20:00:00Z',180,'open')`,
        [futureRaid, f.guild.id, pastRaid],
      );
      await query(
        `INSERT INTO guild_prep_runs(id,guild_id,raid_id,activity_key,activity_label,activity_category,scheduled_for,status) VALUES
      ($1,$2,$3,'dungeon:a','Scheduled Prep','dungeon','2030-01-01T19:00:00Z','open'),
      ($4,$2,$3,'dungeon:b','Unscheduled Prep','dungeon',NULL,'open'),
      ($5,$2,$3,'dungeon:c','Closed Prep','dungeon','2030-01-01T18:00:00Z','completed')`,
        [scheduled, f.guild.id, futureRaid, unscheduled, closed],
      );
      const schedule = await getGuildSchedule(
        f.claimant,
        f.guild.id,
        new Date("2029-01-01T00:00:00Z"),
      );
      assert.deepEqual(
        schedule.entries.map((entry) => entry.title),
        ["Scheduled Prep", "Future Raid"],
      );
      assert.equal(schedule.entries[0].guildLocalTime, "19:00");
      assert.deepEqual(
        schedule.unscheduled.map((run) => run.title),
        ["Unscheduled Prep"],
      );
      await assert.rejects(
        () => getGuildSchedule(randomUUID(), f.guild.id),
        /not found/i,
      );
    } finally {
      await clean(f);
    }
  });
}
