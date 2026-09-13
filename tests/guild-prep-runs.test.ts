import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PrepRunService, normalizePrepRunNote, normalizePrepRunSchedule } from "../lib/guilds/prep-run-service.ts";

const activity = { key: "dungeon:blackrock-depths", label: "Blackrock Depths", category: "dungeon", playerCount: 1, opportunityCount: 3, players: [{ guildCharacterId: "character-1", characterName: "Aidy", className: "Warrior", specName: "Fury", opportunityCount: 3 }] };
const board = { guild: { id: "guild", name: "Guild" }, raid: { id: "raid", name: "Molten Core", instance: "Molten Core", startsAt: new Date().toISOString() }, summary: {}, activityGroups: [activity], raidAlternativeGroups: [], benchCount: 0 } as any;

function fixture(role = "officer", relevant = true) {
  const signups = new Map<string, "going" | "maybe">();
  const records: any[] = [];
  const membership = { id: "membership", guild_id: "guild", user_id: "user", role, capabilities: [], revoked_capabilities: [], active: true, created_at: new Date(), updated_at: new Date(), guild_name: "Guild" };
  const repository: any = {
    getMembership: async (userId: string, guildId: string) => userId === "user" && guildId === "guild" ? membership : undefined,
    getRaid: async (guildId: string, raidId: string) => guildId === "guild" && raidId === "raid" ? { id: raidId, raid_leader_user_id: role === "raid-leader" ? "user" : null } : undefined,
    findOpen: async () => records.find((run) => run.status === "open")?.id,
    create: async (_userId: string, input: any) => { records.push({ ...input, id: "run", status: "open" }); return "run"; },
    list: async () => records,
    get: async (guildId: string, runId: string) => guildId === "guild" && runId === "run" ? { id: "run", guildId: "guild", guildName: "Guild", raidId: "raid", raidName: "Molten Core", raidInstance: "Molten Core", raidLeaderUserId: role === "raid-leader" ? "user" : null, activityKey: activity.key, activityLabel: activity.label, activityCategory: activity.category, note: "", status: records[0]?.status ?? "open", organizerName: "Organizer", goingCount: 0, maybeCount: 0, createdAt: "now", updatedAt: "now" } : undefined,
    participants: async () => [...signups].map(([membership_id, status]) => ({ membership_id, display_name: "Member", status })),
    claimedCharacterIds: async () => relevant ? ["character-1"] : [], activeMemberCount: async () => 2,
    update: async (_u: string, _g: string, _r: string, _s: string, note: string) => { records[0].note = note; },
    setStatus: async (_u: string, _g: string, _r: string, status: string) => { records[0].status = status; },
    setSignup: async (_g: string, _r: string, memberId: string, status: "going" | "maybe") => { signups.set(memberId, status); return "signup"; },
    removeSignup: async (_g: string, _r: string, memberId: string) => { signups.delete(memberId); },
  };
  return { service: new PrepRunService(repository, async () => board, async () => relevant ? board : { ...board, activityGroups: [] }), records, signups };
}

test("creation uses canonical board identity, rejects fabricated activities, and returns an existing open run", async () => {
  const { service, records } = fixture();
  await assert.rejects(() => service.create("user", "guild", "raid", "dungeon:fake"), /not found/i);
  assert.equal(await service.create("user", "guild", "raid", activity.key, "2026-09-20T19:00", " Optional run "), "run");
  assert.equal(records[0].activityLabel, "Blackrock Depths"); assert.equal(records[0].note, "Optional run");
  assert.equal(await service.create("user", "guild", "raid", activity.key), "run"); assert.equal(records.length, 1);
});

test("member signup is independent from readiness relevance and supports going, maybe, and leave", async () => {
  const { service, signups } = fixture("member", false);
  await service.setMySignup("user", "guild", "run", "going"); assert.equal(signups.get("membership"), "going");
  await service.setMySignup("user", "guild", "run", "maybe"); assert.equal(signups.get("membership"), "maybe");
  const detail = await service.detail("user", "guild", "run"); assert.equal(detail.myCharacterMayBenefit, false); assert.equal(detail.mayBenefitCount, undefined);
  await service.setMySignup("user", "guild", "run", "leave"); assert.equal(signups.size, 0);
});

test("consent-style relevance can disappear while a voluntary signup remains", async () => {
  const state = fixture("member", true); await state.service.setMySignup("user", "guild", "run", "going");
  assert.equal((await state.service.detail("user", "guild", "run")).myCharacterMayBenefit, true);
  const privateBoard = { ...board, activityGroups: [] };
  const service = new PrepRunService((state.service as any).repository, async () => privateBoard, async () => privateBoard);
  const detail = await service.detail("user", "guild", "run"); assert.equal(detail.myCharacterMayBenefit, false); assert.equal(detail.mySignup, "going");
});

test("management follows canManageRaid and closed runs reject member mutations", async () => {
  const ordinary = fixture("member").service;
  await assert.rejects(() => ordinary.create("user", "guild", "raid", activity.key), /not found/i);
  await assert.rejects(() => ordinary.setStatus("user", "guild", "run", "completed"), /not found/i);
  const managed = fixture(); await managed.service.create("user", "guild", "raid", activity.key); await managed.service.setStatus("user", "guild", "run", "completed");
  await assert.rejects(() => managed.service.setMySignup("user", "guild", "run", "going"), /closed/i);
});

test("validation is bounded and Prep Run architecture has no provider or refresh dependency", () => {
  assert.equal(normalizePrepRunSchedule("2026-09-20T19:00"), "2026-09-20T19:00:00.000Z");
  assert.throws(() => normalizePrepRunSchedule("not-a-date"), /invalid/i); assert.throws(() => normalizePrepRunNote("x".repeat(281)), /280/);
  const files = ["lib/guilds/prep-run-service.ts", "lib/guilds/prep-run-repository.ts", "lib/guilds/prep-run-actions.ts"].map((path) => fs.readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(files, /getCharacterProvider|providers\/factory|findCharacter|refreshCharacter|Battle\.net/i);
  assert.doesNotMatch(files, /className\s*===|specName\s*===|item_name|character_sync_items/);
  assert.match(files, /count\(signup\.id\)[\s\S]*going_count/); assert.doesNotMatch(files, /for\s*\([^)]*prep[\s\S]*query/i);
});
