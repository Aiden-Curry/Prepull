import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

if (!process.env.TEST_DATABASE_URL) {
  test("guild readiness integration requires TEST_DATABASE_URL", { skip: true }, () => {});
} else {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { query, closePool } = await import("../lib/guilds/db.ts");
  const { GuildReadinessRepository } = await import("../lib/guilds/readiness-repository.ts");
  const { enableReadinessShare, disableReadinessShare, getRaidReadiness, listEligibleReadinessShares } = await import("../lib/guilds/readiness-service.ts");

  type Fixture = Awaited<ReturnType<typeof fixture>>;
  async function fixture() {
    const ids = { owner: randomUUID(), officer: randomUUID(), member: randomUUID(), other: randomUUID(), guildB: randomUUID(), leader: randomUUID() };
    for (const [name, id] of Object.entries(ids)) await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x',$3)", [id, `${id}@readiness.test`, name]);
    const guildA = randomUUID(), guildB = randomUUID(), memberA = randomUUID(), memberB = randomUUID(), raidA = randomUUID(), raidB = randomUUID();
    await query(`INSERT INTO guilds(id,name,region,realm_slug,realm_name,character_realm_type,content_version,faction,owner_user_id) VALUES
      ($1,'Readiness A','eu','firemaw','Firemaw','era','era','Horde',$2),($3,'Readiness B','eu','firemaw','Firemaw','era','era','Horde',$4)`, [guildA, ids.owner, guildB, ids.guildB]);
    await query(`INSERT INTO guild_workspace_memberships(guild_id,user_id,role,capabilities,active) VALUES
      ($1,$2,'owner','[]',true),($1,$3,'officer','[]',true),($1,$4,'member','[]',true),($1,$5,'raid-leader','[]',true),($6,$7,'owner','[]',true),($6,$5,'raid-leader','[]',true)`, [guildA, ids.owner, ids.officer, ids.member, ids.leader, guildB, ids.guildB]);
    await query(`INSERT INTO guild_members(id,guild_id,character_id,character_name,class_name,spec,race,faction,realm,region,realm_type,content_version,role,readiness) VALUES
      ($1,$2,'aidy','Aidy','Warrior','Fury','Orc','Horde','Firemaw','eu','era','era','DPS','unknown'),
      ($3,$4,'other','Other','Mage','Fire','Human','Alliance','Firemaw','eu','era','era','DPS','unknown')`, [memberA, guildA, memberB, guildB]);
    await query("INSERT INTO guild_member_links(guild_member_id,user_id,status,verification_method) VALUES($1,$2,'approved','officer-verified')", [memberA, ids.member]);
    const character = randomUUID(), mismatch = randomUUID(), otherCharacter = randomUUID();
    await query(`INSERT INTO user_characters(id,user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,is_primary) VALUES
      ($1,$2,'eu','firemaw','Firemaw','Aidy','aidy','era','era','Warrior',60,'Orc','Horde',true),
      ($3,$2,'eu','firemaw','Firemaw','Lyria','lyria','era','era','Mage',60,'Human','Alliance',false),
      ($4,$5,'eu','firemaw','Firemaw','Aidy','aidy','era','era','Warrior',60,'Orc','Horde',true)`, [character, ids.member, mismatch, otherCharacter, ids.other]);
    const sync = randomUUID();
    await query("INSERT INTO character_syncs(id,user_character_id,level,class_name,spec,race,faction,content_version,character_realm_type,provider,status) VALUES($1,$2,60,'Warrior','Fury','Orc','Horde','era','era','mock','success')", [sync, character]);
    await query("INSERT INTO character_sync_items(sync_id,slot,item_id,item_name,quality,icon) VALUES($1,'Head',700000,'Fresh helm','Uncommon','ST')", [sync]);
    await query("INSERT INTO raid_events(id,guild_id,name,instance,starts_at,duration_minutes,status,raid_leader_user_id) VALUES($1,$2,'Molten Core','Molten Core',now(),180,'open',$3),($4,$5,'Other Raid','Molten Core',now(),180,'open',NULL)", [raidA, guildA, ids.leader, raidB, guildB]);
    await query("INSERT INTO raid_roster_entries(raid_event_id,guild_member_id,roster_state,group_name,role_name) VALUES($1,$2,'selected','Group 1','DPS')", [raidA, memberA]);
    return { ids, guildA, guildB, memberA, memberB, raidA, raidB, character, mismatch, otherCharacter, sync };
  }

  async function clean(f: Fixture) {
    const guilds = [f.guildA, f.guildB], users = Object.values(f.ids);
    await query("UPDATE guilds SET archived_at=now() WHERE id=ANY($1::uuid[])", [guilds]);
    await query("DELETE FROM audit_events WHERE guild_id=ANY($1::uuid[])", [guilds]);
    await query("DELETE FROM guild_readiness_shares WHERE guild_id=ANY($1::uuid[])", [guilds]);
    await query("DELETE FROM character_sync_items WHERE sync_id=$1", [f.sync]);
    await query("DELETE FROM character_syncs WHERE user_character_id=ANY($1::uuid[])", [[f.character, f.mismatch, f.otherCharacter]]);
    await query("DELETE FROM user_characters WHERE user_id=ANY($1::uuid[])", [users]);
    await query("DELETE FROM raid_roster_entries WHERE raid_event_id=ANY($1::uuid[])", [[f.raidA, f.raidB]]);
    await query("DELETE FROM raid_events WHERE id=ANY($1::uuid[])", [[f.raidA, f.raidB]]);
    await query("DELETE FROM guild_member_links WHERE guild_member_id=ANY($1::uuid[])", [[f.memberA, f.memberB]]);
    await query("DELETE FROM guild_members WHERE guild_id=ANY($1::uuid[])", [guilds]);
    await query("DELETE FROM guild_workspace_memberships WHERE guild_id=ANY($1::uuid[])", [guilds]);
    await query("DELETE FROM guilds WHERE id=ANY($1::uuid[])", [guilds]);
    await query("DELETE FROM users WHERE id=ANY($1::uuid[])", [users]);
  }

  test("share persistence enforces approved claim, ownership, canonical identity, uniqueness, and safe audits", async () => {
    const f = await fixture(); try {
      const eligible = await listEligibleReadinessShares(f.ids.member, f.guildA); assert.equal(eligible.length, 1); assert.equal(eligible[0].enabled, false);
      await query("UPDATE guild_member_links SET status='pending' WHERE guild_member_id=$1 AND user_id=$2", [f.memberA, f.ids.member]);
      await assert.rejects(() => enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character), /not eligible/i);
      await query("UPDATE guild_member_links SET status='approved' WHERE guild_member_id=$1 AND user_id=$2", [f.memberA, f.ids.member]);
      await assert.rejects(() => enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.mismatch), /not eligible/i);
      await assert.rejects(() => enableReadinessShare(f.ids.officer, f.guildA, f.memberA, f.character), /not eligible/i);
      await assert.rejects(() => enableReadinessShare(f.ids.member, f.guildB, f.memberA, f.character), /not eligible/i);
      const shareId = await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      assert.equal((await listEligibleReadinessShares(f.ids.member, f.guildA))[0].enabled, true);
      assert.equal((await new GuildReadinessRepository().listEligibleCandidates(f.ids.member, f.guildA))[0].share_id, shareId);
      await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      assert.equal((await query("SELECT count(*)::int AS count FROM guild_readiness_shares WHERE guild_id=$1 AND guild_member_id=$2 AND enabled", [f.guildA, f.memberA])).rows[0].count, 1);
      await assert.rejects(() => query("INSERT INTO guild_readiness_shares(guild_id,guild_member_id,user_id,user_character_id) VALUES($1,$2,$3,$4)", [f.guildA, f.memberA, f.ids.member, f.otherCharacter]));
      const audits = (await query("SELECT action,summary FROM audit_events WHERE guild_id=$1 AND action LIKE 'readiness.%'", [f.guildA])).rows;
      assert.ok(audits.length >= 1); assert.ok(audits.every((row) => Object.keys(row.summary).join() === "guildMemberId"));
      assert.doesNotMatch(JSON.stringify(audits), /equipment|recommendation|token|sync/i);
    } finally { await clean(f); }
  });

  test("raid readiness is manager-only, assigned-leader aware, cross-guild isolated, and privacy-safe", async () => {
    const f = await fixture(); try {
      await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      for (const viewer of [f.ids.owner, f.ids.officer, f.ids.leader]) {
        const readiness = await getRaidReadiness(viewer, f.guildA, f.raidA); assert.equal(readiness.summary.supportedCount, 1);
        const serialized = JSON.stringify(readiness); assert.doesNotMatch(serialized, /@readiness\.test|userCharacterId|shareId|syncHistory|sessionPlan/);
      }
      await assert.rejects(() => getRaidReadiness(f.ids.member, f.guildA, f.raidA), /not found/i);
      await assert.rejects(() => getRaidReadiness(f.ids.leader, f.guildB, f.raidB), /not found/i);
      await assert.rejects(() => getRaidReadiness(f.ids.guildB, f.guildA, f.raidA), /not found/i);
    } finally { await clean(f); }
  });

  test("claim revocation disables consent immediately and reapproval never silently re-enables it", async () => {
    const f = await fixture(); try {
      await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      await query("UPDATE guild_member_links SET status='revoked' WHERE guild_member_id=$1 AND user_id=$2", [f.memberA, f.ids.member]);
      assert.equal((await query("SELECT enabled FROM guild_readiness_shares WHERE guild_member_id=$1", [f.memberA])).rows[0].enabled, false);
      assert.equal((await getRaidReadiness(f.ids.owner, f.guildA, f.raidA)).summary.notSharingCount, 1);
      await query("UPDATE guild_member_links SET status='approved' WHERE guild_member_id=$1 AND user_id=$2", [f.memberA, f.ids.member]);
      assert.equal((await getRaidReadiness(f.ids.owner, f.guildA, f.raidA)).summary.notSharingCount, 1);
    } finally { await clean(f); }
  });

  test("membership deactivation and saved-character archive revoke exposure without deleting guild data", async () => {
    const f = await fixture(); try {
      let share = await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      await query("UPDATE guild_workspace_memberships SET active=false WHERE guild_id=$1 AND user_id=$2", [f.guildA, f.ids.member]);
      assert.equal((await query("SELECT enabled FROM guild_readiness_shares WHERE id=$1", [share])).rows[0].enabled, false);
      await query("UPDATE guild_workspace_memberships SET active=true WHERE guild_id=$1 AND user_id=$2", [f.guildA, f.ids.member]);
      assert.equal((await getRaidReadiness(f.ids.owner, f.guildA, f.raidA)).summary.notSharingCount, 1);
      share = await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      await query("UPDATE user_characters SET archived_at=now(),is_primary=false WHERE id=$1", [f.character]);
      assert.equal((await query("SELECT enabled FROM guild_readiness_shares WHERE id=$1", [share])).rows[0].enabled, false);
      assert.equal((await query("SELECT count(*)::int AS count FROM guild_members WHERE id=$1", [f.memberA])).rows[0].count, 1);
      assert.equal((await query("SELECT count(*)::int AS count FROM character_syncs WHERE user_character_id=$1", [f.character])).rows[0].count, 1);
    } finally { await clean(f); }
  });

  test("only the owning player can disable a share", async () => {
    const f = await fixture(); try {
      const share = await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      await assert.rejects(() => disableReadinessShare(f.ids.officer, share), /not found/i);
      await disableReadinessShare(f.ids.member, share);
      assert.equal((await query("SELECT enabled FROM guild_readiness_shares WHERE id=$1", [share])).rows[0].enabled, false);
    } finally { await clean(f); }
  });

  test("inactive roster characters invalidate sharing and reactivation requires fresh consent", async () => {
    const f = await fixture(); try {
      const share = await enableReadinessShare(f.ids.member, f.guildA, f.memberA, f.character);
      await query("UPDATE guild_members SET active=false WHERE id=$1", [f.memberA]);
      assert.equal((await query("SELECT enabled FROM guild_readiness_shares WHERE id=$1", [share])).rows[0].enabled, false);
      await query("UPDATE guild_members SET active=true WHERE id=$1", [f.memberA]);
      assert.equal((await getRaidReadiness(f.ids.owner, f.guildA, f.raidA)).summary.notSharingCount, 1);
    } finally { await clean(f); }
  });

  test.after(async () => closePool());
}
