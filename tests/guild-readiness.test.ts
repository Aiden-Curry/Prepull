import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { eraCombatRogueFixtures, eraHolyPriestFixtures, eraMarksmanshipHunterFixtures } from "../lib/gear-analysis/additional-spec-fixtures.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { eraFrostMageFixtures } from "../lib/gear-analysis/mage-fixtures.ts";
import { identitiesMatch, projectGuildCharacterReadiness, summarizeReadiness } from "../lib/guilds/readiness-service.ts";
import type { RaidReadinessRow } from "../lib/guilds/readiness-repository.ts";
import type { NormalizedCharacter } from "../lib/types.ts";

const rowFor = (character: NormalizedCharacter, overrides: Partial<RaidReadinessRow> = {}): RaidReadinessRow => ({
  guild_member_id: `guild-${character.id}`, character_name: character.name, roster_class_name: character.class,
  roster_spec: character.spec, roster_role: "DPS", group_name: "Group 2", role_name: "DPS", main_name: "",
  member_active: true, member_region: character.region, member_realm: character.realm,
  member_realm_type: character.realmType, member_content_version: character.contentVersion,
  share_id: "share", share_user_id: "user", user_character_id: character.id, share_enabled: true,
  share_membership_active: true, claim_status: "approved", character_region: character.region,
  realm_slug: character.realm.toLowerCase(), realm_name: character.realm, saved_character_name: character.name,
  normalized_character_name: character.name.toLowerCase(), character_realm_type: character.realmType,
  character_content_version: character.contentVersion, archived_at: null, sync_id: "sync",
  synced_at: "2026-09-11T10:00:00.000Z", level: character.level, sync_class_name: character.class,
  sync_spec: character.spec, sync_race: character.race, sync_faction: character.faction,
  professions: character.professions, talents: character.talents ?? [], sync_content_version: character.contentVersion,
  sync_realm_type: character.realmType, provider: "mock", roster_state: "selected", ...overrides,
});

test("readiness identity uses region, canonical realm/name, realm ecosystem, and content version", () => {
  const base = rowFor(eraFuryFixtures.fresh60);
  assert.equal(identitiesMatch(base as any), true);
  for (const changed of [
    { character_region: "us" }, { realm_slug: "whitemane" }, { normalized_character_name: "someone-else" },
    { character_realm_type: "anniversary" }, { character_content_version: "tbc" },
  ]) assert.equal(identitiesMatch({ ...base, ...changed } as any), false);
});

test("no share, no successful sync, and unsupported spec stay neutral and deterministic", () => {
  const fury = eraFuryFixtures.fresh60;
  const noShare = projectGuildCharacterReadiness(rowFor(fury, { share_id: null }), fury.equipment);
  assert.equal(noShare.shareState, "not-shared"); assert.equal(noShare.dataState, "unavailable");
  const noSync = projectGuildCharacterReadiness(rowFor(fury, { sync_id: null }), []);
  assert.equal(noSync.shareState, "shared"); assert.equal(noSync.dataState, "needs-refresh"); assert.match(noSync.message, /refresh/i);
  const unsupportedCharacter = { ...eraFrostMageFixtures.fresh60, spec: "Fire" };
  const unsupported = projectGuildCharacterReadiness(rowFor(unsupportedCharacter), unsupportedCharacter.equipment);
  assert.equal(unsupported.dataState, "unsupported-spec"); assert.equal(unsupported.recommendationSupport?.supported, false);
  assert.doesNotMatch(unsupported.message, /unready|undergeared|bench/i);
});

test("all five supported specs project the existing PlayerAdvice summary without cross-spec UI branches", () => {
  const cases = [eraFuryFixtures.fresh60, eraFrostMageFixtures.fresh60, eraCombatRogueFixtures.fresh60, eraMarksmanshipHunterFixtures.fresh60, eraHolyPriestFixtures.fresh60];
  const keys = ["era-warrior-fury", "era-mage-frost", "era-rogue-combat", "era-hunter-marksman", "era-priest-holy"];
  cases.forEach((character, index) => {
    const projected = projectGuildCharacterReadiness(rowFor(character), character.equipment);
    assert.equal(projected.dataState, "available"); assert.equal(projected.recommendationSupport?.specKey, keys[index]);
    assert.equal(projected.summary?.evaluatedSlots, 17); assert.ok((projected.summary?.actionableUpgradeCount ?? 0) >= 0);
    assert.ok(projected.lastRefreshedAt); assert.ok(projected.activityCategoryCounts);
  });
});

test("revoked claims, inactive memberships, archived characters, and identity mismatches expose no shared data", () => {
  const character = eraFuryFixtures.fresh60;
  for (const override of [{ claim_status: "revoked" }, { share_membership_active: false }, { archived_at: "2026-09-11" }, { realm_slug: "wrong-realm" }]) {
    const projected = projectGuildCharacterReadiness(rowFor(character, override), character.equipment);
    assert.equal(projected.shareState, "not-shared"); assert.equal(projected.summary, undefined);
  }
  assert.equal(projectGuildCharacterReadiness(rowFor(character, { member_active: false }), []).shareState, "unavailable");
});

test("selected summary categories are factual and bench rows remain separate", () => {
  const character = eraFuryFixtures.fresh60;
  const available = projectGuildCharacterReadiness(rowFor(character), character.equipment);
  const refresh = projectGuildCharacterReadiness(rowFor(character, { sync_id: null }), []);
  const unsupportedCharacter = { ...character, spec: "Arms" };
  const unsupported = projectGuildCharacterReadiness(rowFor(unsupportedCharacter), unsupportedCharacter.equipment);
  const notShared = projectGuildCharacterReadiness(rowFor(character, { share_id: null }), []);
  assert.deepEqual(summarizeReadiness([available, refresh, unsupported, notShared]), { selectedCount: 4, sharingCount: 3, supportedCount: 1, needsRefreshCount: 1, unsupportedCount: 1, notSharingCount: 1 });
  assert.equal(summarizeReadiness([available]).selectedCount, 1);
});

test("guild readiness serialization excludes private identifiers, history, planner data, and numeric scores", () => {
  const projected = projectGuildCharacterReadiness(rowFor(eraFuryFixtures.fresh60), eraFuryFixtures.fresh60.equipment);
  const serialized = JSON.stringify(projected);
  for (const forbidden of ["userCharacterId", "shareId", "userId", "email", "password", "syncHistory", "sessionPlan", "gearScore", "readinessScore", "readinessPercentage"]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("raid readiness loading has no character-provider dependency or refresh path", () => {
  const source = fs.readFileSync("lib/guilds/readiness-service.ts", "utf8") + fs.readFileSync("lib/guilds/readiness-repository.ts", "utf8");
  assert.doesNotMatch(source, /getCharacterProvider|providers\/factory|findCharacter|refreshCharacter/);
});
