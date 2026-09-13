import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";

if (!process.env.TEST_DATABASE_URL) {
  test("Prep Run integration requires TEST_DATABASE_URL", { skip: true }, () => {});
} else {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { closePool, query } = await import("../lib/guilds/db.ts");
  const { PrepRunRepository } = await import("../lib/guilds/prep-run-repository.ts");
  const { PrepRunService } = await import("../lib/guilds/prep-run-service.ts");
  const { disableReadinessShare, enableReadinessShare, getRaidPrepBoard } = await import("../lib/guilds/readiness-service.ts");

  type Fixture = Awaited<ReturnType<typeof fixture>>;
  async function fixture() {
    const users = Object.fromEntries(["owner", "officer", "leader", "unassigned", "member", "nonsharing", "inactive", "guildB"].map((key) => [key, randomUUID()])) as Record<string, string>;
    for (const [name, id] of Object.entries(users)) await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x',$3)", [id, `${id}@prep-run.test`, name]);
    const guildA = randomUUID(), guildB = randomUUID(), raidA = randomUUID(), raidUnassigned = randomUUID(), raidB = randomUUID(), memberA = randomUUID();
    await query(`INSERT INTO guilds(id,name,region,realm_slug,realm_name,character_realm_type,content_version,faction,owner_user_id) VALUES
      ($1,'Prep A','eu','firemaw','Firemaw','era','era','Horde',$2),($3,'Prep B','eu','firemaw','Firemaw','era','era','Horde',$4)`, [guildA, users.owner, guildB, users.guildB]);
    await query(`INSERT INTO guild_workspace_memberships(guild_id,user_id,role,active) VALUES
      ($1,$2,'owner',true),($1,$3,'officer',true),($1,$4,'raid-leader',true),($1,$5,'raid-leader',true),
      ($1,$6,'member',true),($1,$7,'member',true),($1,$8,'member',false),($9,$10,'owner',true)`, [guildA, users.owner, users.officer, users.leader, users.unassigned, users.member, users.nonsharing, users.inactive, guildB, users.guildB]);
    await query(`INSERT INTO guild_members(id,guild_id,character_id,character_name,class_name,spec,race,faction,realm,region,realm_type,content_version,role,readiness) VALUES($1,$2,'aidy','Aidy','Warrior','Fury','Orc','Horde','Firemaw','eu','era','era','DPS','unknown')`, [memberA, guildA]);
    await query("INSERT INTO guild_member_links(guild_member_id,user_id,status,verification_method) VALUES($1,$2,'approved','officer-verified')", [memberA, users.member]);
    const character = randomUUID(), sync = randomUUID();
    await query(`INSERT INTO user_characters(id,user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,is_primary) VALUES($1,$2,'eu','firemaw','Firemaw','Aidy','aidy','era','era','Warrior',60,'Orc','Horde',true)`, [character, users.member]);
    const source = eraFuryFixtures.fresh60;
    await query(`INSERT INTO character_syncs(id,user_character_id,level,class_name,spec,race,faction,professions,talents,content_version,character_realm_type,provider,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'era','era','mock','success')`, [sync, character, source.level, source.class, source.spec, source.race, source.faction, JSON.stringify(source.professions), JSON.stringify(source.talents ?? [])]);
    for (const item of source.equipment) await query(`INSERT INTO character_sync_items(sync_id,slot,item_id,item_name,item_level,quality,icon,stats,enchantments,weapon,set_id,special_effect_id,unique_group,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [sync, item.slot, item.itemId || null, item.name, item.itemLevel ?? null, item.quality, item.icon, JSON.stringify(item.stats), JSON.stringify(item.enchantments ?? []), item.weapon ? JSON.stringify(item.weapon) : null, item.setId ?? null, item.specialEffectId ?? null, item.uniqueGroup ?? null, item.source ? JSON.stringify(item.source) : null]);
    await query(`INSERT INTO raid_events(id,guild_id,name,instance,starts_at,duration_minutes,status,raid_leader_user_id) VALUES
      ($1,$2,'Molten Core','Molten Core',now(),180,'open',$3),($4,$2,'Other MC','Molten Core',now(),180,'open',$5),($6,$7,'Guild B Raid','Molten Core',now(),180,'open',NULL)`, [raidA, guildA, users.leader, raidUnassigned, users.officer, raidB, guildB]);
    await query("INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,group_name,role_name) VALUES($1,$2,'selected','Group 1','DPS')", [raidA, memberA]);
    const shareId = await enableReadinessShare(users.member, guildA, memberA, character);
    const activity = (await getRaidPrepBoard(users.owner, guildA, raidA)).activityGroups.find((group) => group.label === "Blackrock Depths")!;
    return { users, guildA, guildB, raidA, raidUnassigned, raidB, memberA, character, sync, shareId, activity };
  }

  async function clean(f: Fixture) {
    const guilds = [f.guildA, f.guildB], raids = [f.raidA, f.raidUnassigned, f.raidB], userIds = Object.values(f.users);
    const cleanup: Array<[string, string, unknown[]]> = [
      ["archive guilds", "UPDATE guilds SET archived_at=now() WHERE id=ANY($1::uuid[])", [guilds]],
      ["audit events", "DELETE FROM audit_events WHERE guild_id=ANY($1::uuid[])", [guilds]],
      ["prep runs", "DELETE FROM guild_prep_runs WHERE guild_id=ANY($1::uuid[])", [guilds]],
      ["readiness shares", "DELETE FROM guild_readiness_shares WHERE guild_id=ANY($1::uuid[])", [guilds]],
      ["sync items", "DELETE FROM character_sync_items WHERE sync_id=$1", [f.sync]],
      ["sync", "DELETE FROM character_syncs WHERE id=$1", [f.sync]],
      ["character", "DELETE FROM user_characters WHERE id=$1", [f.character]],
      ["roster", "DELETE FROM raid_roster_entries WHERE raid_event_id=ANY($1::uuid[])", [raids]],
      ["raids", "DELETE FROM raid_events WHERE id=ANY($1::uuid[])", [raids]],
      ["member links", "DELETE FROM guild_member_links WHERE guild_member_id=$1", [f.memberA]],
      ["members", "DELETE FROM guild_members WHERE guild_id=ANY($1::uuid[])", [guilds]],
      ["memberships", "DELETE FROM guild_workspace_memberships WHERE guild_id=ANY($1::uuid[])", [guilds]],
      ["guilds", "DELETE FROM guilds WHERE id=ANY($1::uuid[])", [guilds]],
      ["users", "DELETE FROM users WHERE id=ANY($1::uuid[])", [userIds]],
    ];
    for (const [label, statement, values] of cleanup) {
      try { await query(statement, values); } catch (error) { throw new Error(`Prep Run fixture cleanup failed at ${label}`, { cause: error }); }
    }
  }

  test("schema enforces guild consistency, canonical identity immutability, and one open run", async () => {
    const f = await fixture(); try {
      const service = new PrepRunService(); const runId = await service.create(f.users.officer, f.guildA, f.raidA, f.activity.key, "2026-09-20T19:00", "BRD");
      assert.equal((await new PrepRunRepository().get(f.guildA, runId))?.activityLabel, "Blackrock Depths");
      assert.equal(await service.create(f.users.owner, f.guildA, f.raidA, f.activity.key), runId);
      await query("DELETE FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$2", [f.guildA, f.users.officer]);
      assert.equal((await query("SELECT created_by_membership_id FROM guild_prep_runs WHERE id=$1", [runId])).rows[0].created_by_membership_id, null);
      await assert.rejects(() => query("INSERT INTO guild_prep_runs(guild_id,raid_id,activity_key,activity_label,activity_category,created_by_membership_id) SELECT $1,$2,$3,'Blackrock Depths','dungeon',id FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$4", [f.guildA, f.raidA, f.activity.key, f.users.owner]));
      await assert.rejects(() => query("UPDATE guild_prep_runs SET activity_label='Changed' WHERE id=$1", [runId]));
      await assert.rejects(() => query("INSERT INTO guild_prep_runs(guild_id,raid_id,activity_key,activity_label,activity_category) VALUES($1,$2,'bad','Bad','other')", [f.guildA, f.raidB]));
      await service.setStatus(f.users.owner, f.guildA, runId, "completed");
      const replacement = await service.create(f.users.owner, f.guildA, f.raidA, f.activity.key); assert.notEqual(replacement, runId);
    } finally { await clean(f); }
  });

  test("self-service signup inserts, changes, leaves, and closes without officer override", async () => {
    const f = await fixture(); try {
      const service = new PrepRunService(); const runId = await service.create(f.users.owner, f.guildA, f.raidA, f.activity.key);
      await service.setMySignup(f.users.member, f.guildA, runId, "going"); assert.equal((await service.detail(f.users.member, f.guildA, runId)).mySignup, "going");
      await service.setMySignup(f.users.member, f.guildA, runId, "maybe"); assert.equal((await service.detail(f.users.owner, f.guildA, runId)).participants[0].status, "maybe");
      await service.setMySignup(f.users.nonsharing, f.guildA, runId, "going"); assert.equal((await service.detail(f.users.nonsharing, f.guildA, runId)).myCharacterMayBenefit, false);
      await service.setMySignup(f.users.member, f.guildA, runId, "leave"); assert.equal((await service.detail(f.users.member, f.guildA, runId)).mySignup, undefined);
      await service.setStatus(f.users.owner, f.guildA, runId, "cancelled"); await assert.rejects(() => service.setMySignup(f.users.member, f.guildA, runId, "going"), /closed/i);
      const membership = (await query("SELECT id FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$2", [f.guildA, f.users.member])).rows[0];
      await assert.rejects(() => query("INSERT INTO guild_prep_run_signups(guild_id,prep_run_id,membership_id,status) VALUES($1,$2,$3,'going')", [f.guildA, runId, membership.id]));
    } finally { await clean(f); }
  });

  test("management reuses owner, officer, assigned-leader, ordinary, and unassigned-leader semantics", async () => {
    const f = await fixture(); try {
      const service = new PrepRunService();
      for (const userId of [f.users.owner, f.users.officer, f.users.leader]) assert.ok(await service.create(userId, f.guildA, f.raidA, f.activity.key));
      await assert.rejects(() => service.create(f.users.member, f.guildA, f.raidA, f.activity.key), /not found/i);
      await assert.rejects(() => service.create(f.users.unassigned, f.guildA, f.raidA, f.activity.key), /not found/i);
      await assert.rejects(() => service.create(f.users.guildB, f.guildA, f.raidA, f.activity.key), /not found/i);
      await assert.rejects(() => service.list(f.users.guildB, f.guildA), /not found/i);
    } finally { await clean(f); }
  });

  test("consent revocation removes live relevance but preserves voluntary attendance", async () => {
    const f = await fixture(); try {
      const service = new PrepRunService(); const runId = await service.create(f.users.owner, f.guildA, f.raidA, f.activity.key);
      await service.setMySignup(f.users.member, f.guildA, runId, "going");
      assert.equal((await service.detail(f.users.member, f.guildA, runId)).myCharacterMayBenefit, true); assert.equal((await service.detail(f.users.owner, f.guildA, runId)).mayBenefitCount, 1);
      await disableReadinessShare(f.users.member, f.shareId);
      const memberView = await service.detail(f.users.member, f.guildA, runId); assert.equal(memberView.myCharacterMayBenefit, false); assert.equal(memberView.mySignup, "going");
      const managerView = await service.detail(f.users.owner, f.guildA, runId); assert.equal(managerView.mayBenefitCount, 0); assert.equal(managerView.participants.length, 1);
    } finally { await clean(f); }
  });

  test("inactive memberships cannot discover or mutate and disappear from active participant projection", async () => {
    const f = await fixture(); try {
      const service = new PrepRunService(); const runId = await service.create(f.users.owner, f.guildA, f.raidA, f.activity.key); await service.setMySignup(f.users.member, f.guildA, runId, "going");
      await query("UPDATE guild_workspace_memberships SET active=false WHERE guild_id=$1 AND user_id=$2", [f.guildA, f.users.member]);
      await assert.rejects(() => service.detail(f.users.member, f.guildA, runId), /not found/i); await assert.rejects(() => service.setMySignup(f.users.member, f.guildA, runId, "maybe"), /not found/i);
      assert.equal((await service.detail(f.users.owner, f.guildA, runId)).participants.length, 0);
      assert.equal((await query("SELECT count(*)::int AS count FROM guild_prep_run_signups WHERE prep_run_id=$1", [runId])).rows[0].count, 1);
    } finally { await clean(f); }
  });

  test.after(async () => closePool());
}
