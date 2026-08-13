import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const { query, closePool } = await import("../lib/guilds/db.ts");
const { PostgresGuildRepository } = await import("../lib/guilds/postgres-repository.ts");
test.after(async () => { await closePool(); });

async function clean(guildId: string, users: string[]) {
  await query("UPDATE guilds SET archived_at=now() WHERE id=$1", [guildId]);
  await query("DELETE FROM raid_assignment_assignees WHERE assignment_id IN (SELECT id FROM raid_assignments WHERE raid_event_id IN (SELECT id FROM raid_events WHERE guild_id=$1))", [guildId]);
  await query("DELETE FROM raid_assignments WHERE raid_event_id IN (SELECT id FROM raid_events WHERE guild_id=$1)", [guildId]);
  await query("DELETE FROM raid_signups WHERE raid_event_id IN (SELECT id FROM raid_events WHERE guild_id=$1)", [guildId]);
  await query("DELETE FROM raid_roster_entries WHERE raid_event_id IN (SELECT id FROM raid_events WHERE guild_id=$1)", [guildId]);
  await query("DELETE FROM raid_events WHERE guild_id=$1", [guildId]);
  await query("DELETE FROM audit_events WHERE guild_id=$1", [guildId]);
  await query("DELETE FROM guild_members WHERE guild_id=$1", [guildId]);
  await query("DELETE FROM guild_workspace_memberships WHERE guild_id=$1", [guildId]);
  await query("DELETE FROM guilds WHERE id=$1", [guildId]);
  await query("DELETE FROM users WHERE id = ANY($1::uuid[])", [users]);
}

test("Postgres guild data survives repository recreation and loads relations", { skip: !enabled }, async () => {
  const repo = new PostgresGuildRepository(); const userId = randomUUID(); const otherUserId = randomUUID();
  await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'test-hash','Integration Owner'),($3,$4,'test-hash','Other User')", [userId, `${userId}@integration.local`, otherUserId, `${otherUserId}@integration.local`]);
  const guild = await repo.createGuild(userId, { name: `Integration ${userId.slice(0, 6)}`, region: "eu", realmSlug: "firemaw", realmName: "Firemaw", characterRealmType: "era", contentVersion: "era", faction: "Horde", description: "integration" });
  try {
    const member = await repo.addMember(userId, guild.id, { characterId: `char-${userId}`, characterName: "Aidy", className: "Warrior", spec: "Fury", level: 60, race: "Orc", faction: "Horde", realm: "Firemaw", region: "eu", realmType: "era", contentVersion: "era", role: "DPS", readiness: "ready" });
    const raid = await repo.createRaid(userId, guild.id, { name: "MC Integration", instance: "Molten Core", startsAt: "2026-08-15T19:00:00Z", durationMinutes: 240 });
    await repo.setSignup(userId, guild.id, raid.id, member.id, "confirmed", "integration"); await repo.selectRoster(userId, guild.id, raid.id, [member.id]); await repo.saveGroup(userId, guild.id, raid.id, { id: "", name: "Group 1", memberCharacterIds: [member.id] }); await repo.saveAssignment(userId, guild.id, raid.id, { id: "", characterId: member.id, label: "Interrupt", detail: "Test assignment" });
    const workspace = await new PostgresGuildRepository().getWorkspace(userId, guild.id); assert.equal(workspace.guild.id, guild.id); assert.equal(workspace.roster[0].characterName, "Aidy"); assert.equal(workspace.events[0].signups[0].status, "confirmed"); assert.equal(workspace.events[0].groups[0].name, "Group 1"); assert.equal(workspace.events[0].assignments[0].label, "Interrupt");
  } finally { await clean(guild.id, [userId, otherUserId]); }
});

test("Postgres repository rejects cross-guild workspace access", { skip: !enabled }, async () => {
  const repo = new PostgresGuildRepository(); const userId = randomUUID(); const otherId = randomUUID();
  await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x','A'),($3,$4,'x','B')", [userId, `${userId}@integration.local`, otherId, `${otherId}@integration.local`]);
  const guild = await repo.createGuild(userId, { name: `Private ${userId.slice(0, 6)}`, region: "eu", realmSlug: "firemaw", realmName: "Firemaw", characterRealmType: "era", contentVersion: "era", faction: "Alliance", description: "" });
  try { await assert.rejects(() => repo.getWorkspace(otherId, guild.id), /active member|permission/i); } finally { await clean(guild.id, [userId, otherId]); }
});
