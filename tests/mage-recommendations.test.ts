import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCuratedReference } from "../lib/curated-gear/evaluate.ts";
import { eraFrostMageCandidates } from "../lib/gear-analysis/mage-dataset.ts";
import { eraFrostMageFixtures } from "../lib/gear-analysis/mage-fixtures.ts";
import { buildPlayerAdvice } from "../lib/player-advice/service.ts";
import { buildSessionPlan } from "../lib/session-planner/service.ts";
import { loadRecommendationProfile, recommendationRegistry } from "../lib/recommendations/registry.ts";
import type { CuratedReferenceProfile } from "../lib/curated-gear/types.ts";
import { itemSlotForInventoryType, weaponHandForInventoryType } from "../lib/blizzard/item-data-provider.ts";

const registration = recommendationRegistry.find((entry) => entry.key === "era-mage-frost")!;
const profile = loadRecommendationProfile(registration);
const evaluate = (character = eraFrostMageFixtures.fresh60, setId = profile.defaultSetId, phase?: 1 | 2 | 3 | 4 | 5 | 6) => evaluateCuratedReference(character, profile, setId, phase, registration.candidates);
const optionIds = (result: ReturnType<typeof evaluate>) => result.recommendations.flatMap((entry) => [entry.target, entry.bestRealistic, ...entry.otherOptions]).filter(Boolean).map((item) => item!.itemId);

test("fresh Frost Mage receives useful explainable Pre-Raid activities", () => {
  const result = evaluate();
  assert.equal(result.profileId, "era-frost-mage-curated-reference-v1");
  assert.equal(result.recommendations.length, 17);
  assert.ok(result.realisticActivities.length > 0);
  assert.ok(result.realisticActivities.some((activity) => ["Blackrock Depths", "Stratholme", "Tailoring"].includes(activity.activity)));
});

test("partial and near-reference Frost fixtures update priorities without fake dungeon targets", () => {
  const fresh = buildPlayerAdvice(eraFrostMageFixtures.fresh60).advice;
  const partial = buildPlayerAdvice(eraFrostMageFixtures.partial).advice;
  const near = evaluate(eraFrostMageFixtures.nearReference);
  assert.ok(partial.summary.actionableUpgradeCount < fresh.summary.actionableUpgradeCount);
  assert.equal(near.realisticActivities.length, 0);
  assert.ok(near.recommendations.every((entry) => !["major-opportunity", "meaningful-upgrade", "upgrade"].includes(entry.priority)));
});

test("Mage weapon evaluation supports one-hand/off-hand and two-hand occupancy", () => {
  assert.equal(itemSlotForInventoryType("ROBE"), "Chest");
  assert.equal(itemSlotForInventoryType("INVTYPE_2HWEAPON"), "Main Hand");
  assert.equal(weaponHandForInventoryType("INVTYPE_2HWEAPON"), "two-hand");
  const oneHand = evaluate();
  assert.equal(oneHand.recommendations.find((entry) => entry.slot === "Main Hand")?.target?.itemId, 13964);
  assert.equal(oneHand.recommendations.find((entry) => entry.slot === "Off Hand / Shield")?.target?.itemId, 11904);
  const base = profile.sets.find((set) => set.id === profile.defaultSetId)!;
  const staff = base.slots["Main Hand"]!.find((entry) => entry.itemId === 18534)!;
  const twoHandProfile: CuratedReferenceProfile = { ...profile, sets: [{ ...base, slots: { ...base.slots, "Main Hand": [{ ...staff, tier: "bis", rank: 1 }] } }] };
  const twoHand = evaluateCuratedReference(eraFrostMageFixtures.fresh60, twoHandProfile, base.id, undefined, eraFrostMageCandidates);
  assert.equal(twoHand.recommendations.find((entry) => entry.slot === "Main Hand")?.target?.itemId, 18534);
  assert.equal(twoHand.recommendations.find((entry) => entry.slot === "Off Hand / Shield")?.target, undefined);
  assert.match(twoHand.recommendations.find((entry) => entry.slot === "Off Hand / Shield")?.reason ?? "", /two-handed/i);
});

test("paired rings and trinkets respect duplicate and unique restrictions", () => {
  const result = evaluate();
  const rings = result.recommendations.filter((entry) => entry.slot.startsWith("Finger")).map((entry) => entry.target?.itemId);
  const trinkets = result.recommendations.filter((entry) => entry.slot.startsWith("Trinket")).map((entry) => entry.target?.itemId);
  assert.equal(new Set(rings).size, rings.length);
  assert.equal(new Set(trinkets).size, trinkets.length);
});

test("Pre-Raid keeps raid targets out of farm advice and Phase 1 exposes raids separately", () => {
  const preRaid = evaluate();
  const phaseOne = evaluate(eraFrostMageFixtures.fresh60, "era-frost-mage-phase-1", 1);
  assert.equal(preRaid.raidActivities.length, 0);
  assert.equal(optionIds(preRaid).some((id) => eraFrostMageCandidates.some((candidate) => candidate.itemId === id && candidate.source?.type === "Raid")), false);
  assert.ok(phaseOne.raidActivities.some((activity) => activity.activity === "Molten Core"));
  assert.ok(phaseOne.raidActivities.some((activity) => activity.activity === "Onyxia's Lair"));
  assert.ok(phaseOne.realisticActivities.every((activity) => activity.view === "realistic-non-raid"));
});

test("future-phase rows are unavailable when evaluating Phase 1", () => {
  const base = profile.sets.find((set) => set.id === profile.defaultSetId)!;
  const futureCandidate = { ...eraFrostMageCandidates[0], itemId: 19325, name: "Future test row", availability: { ...eraFrostMageCandidates[0].availability, phase: 2 } };
  const futureProfile: CuratedReferenceProfile = { ...profile, sets: [{ ...base, slots: { Head: [{ ...base.slots.Head![0], itemId: 19325, phase: 2 }] } }] };
  const result = evaluateCuratedReference(eraFrostMageFixtures.fresh60, futureProfile, base.id, 1, [futureCandidate]);
  assert.equal(result.recommendations[0].target, undefined);
  assert.match(result.recommendations[0].conditionalNotes[0], /unavailable in Phase 1/i);
});

test("crafting is grouped and aspirational world drops do not outrank realistic paths", () => {
  const result = evaluate();
  assert.ok(result.realisticActivities.some((activity) => activity.activity === "Tailoring" && activity.upgrades.some((entry) => entry.target?.itemId === 14152)));
  const ring = result.recommendations.find((entry) => entry.slot === "Finger 2")!;
  assert.equal(ring.target?.itemId, 13001);
  assert.equal(ring.bestRealistic?.itemId, 16058);
  assert.equal(result.realisticActivities.some((activity) => activity.upgrades.some((entry) => entry.bestRealistic?.itemId === 13001)), false);
});

test("Frost PlayerAdvice contains no Fury items and drives every planner duration/preference", () => {
  const advice = buildPlayerAdvice(eraFrostMageFixtures.fresh60).advice;
  const mageIds = new Set(eraFrostMageCandidates.map((item) => item.itemId));
  const targetIds = [...advice.topActions, ...advice.secondaryActions].flatMap((action) => action.targets.map((target) => target.itemId));
  assert.ok(targetIds.length > 0 && targetIds.every((id) => mageIds.has(id)));
  for (const duration of ["30m", "60m", "90m", "120m"] as const) for (const preference of ["best-progress", "dungeons", "solo-prep", "raid-prep"] as const) {
    const plan = buildSessionPlan({ advice, synced: true, duration, preference });
    if (preference !== "dungeons" || advice.topActions.some((action) => action.type === "dungeon")) assert.ok(plan.primaryAction, `${duration}/${preference}`);
  }
});
