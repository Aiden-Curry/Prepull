import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { eraCombatRogueFixtures, eraHolyPriestFixtures, eraMarksmanshipHunterFixtures } from "../lib/gear-analysis/additional-spec-fixtures.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { eraFrostMageFixtures } from "../lib/gear-analysis/mage-fixtures.ts";
import { buildRaidPrepBoard, projectRaidPrepSource, type RaidPrepSource } from "../lib/guilds/readiness-service.ts";
import type { RaidReadinessRow } from "../lib/guilds/readiness-repository.ts";
import type { NormalizedCharacter } from "../lib/types.ts";

const guild = { id: "guild", name: "Guild" };
const raid = { id: "raid", name: "Molten Core", instance: "Molten Core", startsAt: "2026-09-11T10:00:00.000Z" };
const rowFor = (character: NormalizedCharacter, overrides: Partial<RaidReadinessRow> = {}): RaidReadinessRow => ({
  guild_member_id: `guild-${character.id}`, character_name: character.name, roster_class_name: character.class, roster_spec: character.spec,
  roster_role: "DPS", group_name: "Group 2", role_name: "DPS", member_active: true, member_region: character.region,
  member_realm: character.realm, member_realm_type: character.realmType, member_content_version: character.contentVersion,
  share_id: "share", user_character_id: character.id, share_enabled: true, share_membership_active: true, claim_status: "approved",
  character_region: character.region, realm_slug: character.realm.toLowerCase(), realm_name: character.realm,
  saved_character_name: character.name, normalized_character_name: character.name.toLowerCase(), character_realm_type: character.realmType,
  character_content_version: character.contentVersion, archived_at: null, sync_id: `sync-${character.id}`, synced_at: raid.startsAt,
  level: character.level, sync_class_name: character.class, sync_spec: character.spec, sync_race: character.race,
  sync_faction: character.faction, professions: character.professions, talents: character.talents ?? [],
  sync_content_version: character.contentVersion, sync_realm_type: character.realmType, provider: "mock", roster_state: "selected", ...overrides,
});
const source = (character: NormalizedCharacter, overrides: Partial<RaidReadinessRow> = {}) => projectRaidPrepSource(rowFor(character, overrides), character.equipment);
const board = (sources: RaidPrepSource[]) => buildRaidPrepBoard(guild, raid, sources);

test("activity aggregation keeps player and opportunity counts separate", () => {
  const result = board([source(eraFuryFixtures.fresh60), source(eraFrostMageFixtures.fresh60)]);
  const brd = result.activityGroups.find((group) => group.label === "Blackrock Depths")!;
  assert.equal(brd.playerCount, 2);
  assert.equal(brd.opportunityCount, 7);
  assert.deepEqual(brd.players.map((player) => player.opportunityCount).sort((a, b) => a - b), [3, 4]);
  const ubrs = result.activityGroups.find((group) => group.label === "Upper Blackrock Spire")!;
  assert.equal(ubrs.playerCount, 1);
  assert.equal(ubrs.players[0].opportunityCount, 5);
});

test("realistic activities and raid alternatives are separated while aspirational targets stay private", () => {
  const fury = source(eraFuryFixtures.fresh60);
  const action = fury.advice!.topActions[0];
  fury.advice = { ...fury.advice!, secondaryActions: [{ ...action, id: "raid-test", view: "raid", activity: "Molten Core" }] };
  const result = board([fury]);
  assert.ok(result.activityGroups.every((group) => group.category !== "raid-alternative"));
  assert.equal(result.raidAlternativeGroups[0].label, "Molten Core");
  assert.doesNotMatch(JSON.stringify(result), /itemId|itemName|secondaryTargets|aspirational/i);
});

test("all five supported specs aggregate through normalized advice", () => {
  const characters = [eraFuryFixtures.fresh60, eraFrostMageFixtures.fresh60, eraCombatRogueFixtures.fresh60, eraMarksmanshipHunterFixtures.fresh60, eraHolyPriestFixtures.fresh60];
  const result = board(characters.map((character) => source(character)));
  assert.equal(result.summary.supportedDataCount, 5);
  assert.equal(result.summary.withRealisticOpportunitiesCount, 5);
  const visibleSpecs = new Set(result.activityGroups.flatMap((group) => group.players.map((player) => `${player.className}:${player.specName}`)));
  assert.deepEqual([...visibleSpecs].sort(), ["Hunter:Marksmanship", "Mage:Frost", "Priest:Holy", "Rogue:Combat", "Warrior:Fury"]);
});

test("unsupported, needs-refresh, no-share, and no-opportunity states stay neutral", () => {
  const unsupported = source({ ...eraFrostMageFixtures.fresh60, id: "fire", name: "Fire", spec: "Fire" });
  const needsRefresh = source({ ...eraFuryFixtures.fresh60, id: "refresh", name: "Refresh" }, { sync_id: null });
  const notSharing = source({ ...eraFuryFixtures.fresh60, id: "private", name: "Private" }, { share_id: null });
  const noOpportunity = source({ ...eraFuryFixtures.fresh60, id: "complete", name: "Complete" });
  noOpportunity.advice = { ...noOpportunity.advice!, topActions: [], secondaryActions: [], secondaryTargets: [], summary: { ...noOpportunity.advice!.summary, actionableUpgradeCount: 0, highPriorityCount: 0 } };
  const result = board([unsupported, needsRefresh, notSharing, noOpportunity]);
  assert.deepEqual(result.summary, { selectedCount: 4, sharingCount: 3, supportedDataCount: 1, withRealisticOpportunitiesCount: 0, needsRefreshCount: 1, unsupportedSpecCount: 1, notSharingCount: 1, noStrongPreRaidOpportunitiesCount: 1 });
  assert.equal(result.activityGroups.length, 0);
});

test("bench characters never affect selected aggregation", () => {
  const bench = source(eraFrostMageFixtures.fresh60, { roster_state: "bench" });
  const result = board([source(eraFuryFixtures.fresh60), bench]);
  assert.equal(result.summary.selectedCount, 1);
  assert.equal(result.benchCount, 1);
  assert.ok(result.activityGroups.every((group) => group.players.every((player) => player.characterName !== bench.readiness.characterName)));
});

test("sorting is deterministic and explainable", () => {
  const sources = [source(eraFuryFixtures.fresh60), source(eraFrostMageFixtures.fresh60), source(eraCombatRogueFixtures.fresh60)];
  const forward = board(sources).activityGroups;
  const reverse = board([...sources].reverse()).activityGroups;
  assert.deepEqual(forward, reverse);
  for (let index = 1; index < forward.length; index++) {
    const previous = forward[index - 1], current = forward[index];
    assert.ok(previous.playerCount > current.playerCount || previous.playerCount === current.playerCount && (previous.opportunityCount > current.opportunityCount || previous.opportunityCount === current.opportunityCount && previous.label.localeCompare(current.label) <= 0));
  }
});

test("presentation model excludes private identities, item targets, scores, and histories", () => {
  const serialized = JSON.stringify(board([source(eraFuryFixtures.fresh60)]));
  for (const forbidden of ["userCharacterId", "shareId", "userId", "email", "itemId", "itemName", "syncHistory", "sessionPlan", "readinessScore", "gearScore", "percentage"]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("10, 20, and 40 selected characters aggregate without query-shaped work", () => {
  for (const size of [10, 20, 40]) {
    const sources = Array.from({ length: size }, (_, index) => {
      const character = { ...eraFuryFixtures.fresh60, id: `fury-${size}-${index}`, name: `Fury ${String(index).padStart(2, "0")}` };
      return source(character);
    });
    const result = board(sources);
    assert.equal(result.summary.selectedCount, size);
    assert.equal(result.activityGroups.find((group) => group.label === "Blackrock Depths")?.playerCount, size);
  }
});

test("Prep Board loading stays batched and has no provider, refresh, cache, or persistence path", () => {
  const service = fs.readFileSync("lib/guilds/readiness-service.ts", "utf8");
  const repository = fs.readFileSync("lib/guilds/readiness-repository.ts", "utf8");
  assert.doesNotMatch(service + repository, /getCharacterProvider|providers\/factory|findCharacter|refreshCharacter|prep_board\.viewed/);
  assert.match(service, /loadAuthorizedRaidData/);
  assert.match(repository, /WITH latest_sync/);
  assert.doesNotMatch(service, /INSERT INTO|UPDATE .*prep|DELETE FROM .*prep/i);
});
