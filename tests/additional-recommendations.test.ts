import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { parseAuthoringCsv } from "../lib/curated-gear/authoring.ts";
import { evaluateCuratedReference } from "../lib/curated-gear/evaluate.ts";
import { eraCombatRogueCandidates, eraHolyPriestCandidates, eraMarksmanshipHunterCandidates } from "../lib/gear-analysis/additional-spec-datasets.ts";
import { eraCombatRogueFixtures, eraHolyPriestFixtures, eraMarksmanshipHunterFixtures } from "../lib/gear-analysis/additional-spec-fixtures.ts";
import { buildPlayerAdvice } from "../lib/player-advice/service.ts";
import { recommendationSpecManifests } from "../lib/recommendations/manifests/index.ts";
import { parseSpecManifest } from "../lib/recommendations/manifest.ts";
import { getCharacterRecommendationSupport, loadRecommendationProfile, recommendationRegistry } from "../lib/recommendations/registry.ts";
import { buildSpecSnapshot } from "../lib/recommendations/snapshot.ts";
import { getSupportMatrix } from "../lib/recommendations/support-matrix.ts";
import { validateSpec } from "../lib/recommendations/validate-spec.ts";
import { buildSessionPlan } from "../lib/session-planner/service.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { eraFrostMageFixtures } from "../lib/gear-analysis/mage-fixtures.ts";

const cases = [
  { key: "era-rogue-combat", fixtures: eraCombatRogueFixtures, candidates: eraCombatRogueCandidates },
  { key: "era-hunter-marksman", fixtures: eraMarksmanshipHunterFixtures, candidates: eraMarksmanshipHunterCandidates },
  { key: "era-priest-holy", fixtures: eraHolyPriestFixtures, candidates: eraHolyPriestCandidates },
] as const;

test("all five supported specializations resolve only through the manifest registry", () => {
  assert.equal(recommendationRegistry.length, 5);
  for (const { key, fixtures } of cases) { const support = getCharacterRecommendationSupport(fixtures.fresh60); assert.equal(support.supported && support.specKey, key); }
  assert.equal(getCharacterRecommendationSupport({ ...eraHolyPriestFixtures.fresh60, spec: "Shadow" }).supported, false);
  assert.deepEqual(getSupportMatrix("era").flatMap((entry) => entry.specs.filter((spec) => spec.status === "supported").map((spec) => spec.specKey)), ["era-warrior-fury", "era-hunter-marksman", "era-rogue-combat", "era-priest-holy", "era-mage-frost"]);
});

test("manifest parsing rejects missing fields and duplicate phase metadata", () => {
  assert.ok(parseSpecManifest(null).issues.length);
  const valid = recommendationSpecManifests[2];
  assert.deepEqual(parseSpecManifest(valid).issues, []);
  assert.ok(parseSpecManifest({ ...valid, phases: [valid.phases[0], valid.phases[0]] }).issues.some((issue) => /duplicates Phase|duplicated/.test(issue)));
  assert.ok(parseSpecManifest({ ...valid, documentationPath: "" }).issues.some((issue) => /documentationPath/.test(issue)));
});

test("each second-wave spec handles fresh partial and near-reference states", () => {
  for (const { key, fixtures } of cases) {
    const registration = recommendationRegistry.find((entry) => entry.key === key)!; const profile = loadRecommendationProfile(registration);
    const evaluate = (character: typeof fixtures.fresh60) => evaluateCuratedReference(character, profile, profile.defaultSetId, undefined, registration.candidates);
    const fresh = evaluate(fixtures.fresh60); const partial = evaluate(fixtures.partial); const near = evaluate(fixtures.nearReference);
    assert.equal(fresh.recommendations.length, 17, key); assert.ok(fresh.realisticActivities.length, key);
    assert.ok(partial.recommendations.filter((entry) => entry.priority === "complete").length > fresh.recommendations.filter((entry) => entry.priority === "complete").length, key);
    assert.equal(near.realisticActivities.length, 0, key);
  }
});

test("Phase 1 overlays remain phase-filtered and expose raid activities", () => {
  for (const { key, fixtures } of cases) {
    const registration = recommendationRegistry.find((entry) => entry.key === key)!; const profile = loadRecommendationProfile(registration); const setId = registration.setIdByPhase[1];
    const result = evaluateCuratedReference(fixtures.fresh60, profile, setId, 1, registration.candidates);
    assert.ok(result.raidActivities.some((activity) => activity.activity === "Molten Core"), key);
    assert.ok(result.recommendations.flatMap((entry) => [entry.target, entry.bestRealistic, ...entry.otherOptions]).filter(Boolean).every((item) => item!.reference.phase <= 1), key);
  }
});

test("Rogue weapon roles and Hunter ranged versus melee legality stay isolated", () => {
  const rogue = recommendationRegistry.find((entry) => entry.key === "era-rogue-combat")!; const rogueProfile = loadRecommendationProfile(rogue);
  assert.deepEqual(rogue.ruleModule?.validate(rogue.candidates), []);
  const rogueResult = evaluateCuratedReference(eraCombatRogueFixtures.fresh60, rogueProfile, rogueProfile.defaultSetId, undefined, rogue.candidates);
  assert.match(rogueResult.recommendations.find((entry) => entry.slot === "Main Hand")?.conditionalNotes.join(" ") ?? "", /primary/i);
  assert.match(rogueResult.recommendations.find((entry) => entry.slot === "Off Hand \/ Shield")?.conditionalNotes.join(" ") ?? "", /off-hand/i);
  const hunter = recommendationRegistry.find((entry) => entry.key === "era-hunter-marksman")!; const hunterProfile = loadRecommendationProfile(hunter);
  assert.deepEqual(hunter.ruleModule?.validate(hunter.candidates), []);
  const hunterResult = evaluateCuratedReference(eraMarksmanshipHunterFixtures.fresh60, hunterProfile, hunterProfile.defaultSetId, undefined, hunter.candidates);
  assert.equal(hunterResult.recommendations.find((entry) => entry.slot === "Main Hand")?.target?.itemId, 18520);
  assert.equal(hunterResult.recommendations.find((entry) => entry.slot === "Off Hand / Shield")?.target, undefined);
  assert.match(hunterResult.recommendations.find((entry) => entry.slot === "Ranged / Relic")?.conditionalNotes.join(" ") ?? "", /ranged/i);
});

test("Holy priorities support one-hand off-hand staff and wand paths without a numeric formula", () => {
  const registration = recommendationRegistry.find((entry) => entry.key === "era-priest-holy")!; const profile = loadRecommendationProfile(registration);
  const result = evaluateCuratedReference(eraHolyPriestFixtures.fresh60, profile, profile.defaultSetId, undefined, registration.candidates);
  assert.equal(result.recommendations.find((entry) => entry.slot === "Main Hand")?.target?.itemId, 11923);
  assert.equal(result.recommendations.find((entry) => entry.slot === "Off Hand / Shield")?.target?.itemId, 11928);
  assert.equal(result.recommendations.find((entry) => entry.slot === "Ranged / Relic")?.target?.itemId, 18483);
  assert.ok(result.recommendations.every((entry) => !("score" in entry)));
});

test("second-wave advice remains normalized and drives Session Planner unchanged", () => {
  for (const { key, fixtures, candidates } of cases) {
    const advice = buildPlayerAdvice(fixtures.fresh60).advice; const ids = new Set(candidates.map((item) => item.itemId));
    assert.equal(advice.specKey, key); assert.equal(advice.supported, true); assert.ok(advice.topActions.length);
    assert.ok([...advice.topActions, ...advice.secondaryActions].flatMap((action) => action.targets).every((target) => ids.has(target.itemId)), key);
    assert.ok(buildSessionPlan({ advice, synced: true, duration: "90m", preference: "best-progress" }).primaryAction, key);
  }
});

test("all registered advice targets are independently authored by the resolved spec", () => {
  const fixtures = new Map<string, typeof eraFuryFixtures.fresh60>([
    ["era-warrior-fury", eraFuryFixtures.fresh60], ["era-mage-frost", eraFrostMageFixtures.fresh60],
    ["era-rogue-combat", eraCombatRogueFixtures.fresh60], ["era-hunter-marksman", eraMarksmanshipHunterFixtures.fresh60], ["era-priest-holy", eraHolyPriestFixtures.fresh60],
  ]);
  for (const manifest of recommendationSpecManifests) {
    const authored = new Set(manifest.phases.flatMap((phase) => parseAuthoringCsv(fs.readFileSync(phase.authoringFile, "utf8")).rows.map((row) => Number(row.itemId))));
    const advice = buildPlayerAdvice(fixtures.get(manifest.key)!).advice;
    assert.equal(advice.specKey, manifest.key);
    assert.ok([...advice.topActions, ...advice.secondaryActions].flatMap((action) => action.targets).every((target) => authored.has(target.itemId)), manifest.key);
  }
});

test("supported specializations cannot cross-resolve another spec's dataset", () => {
  const fixtures = new Map<string, typeof eraFuryFixtures.fresh60>([
    ["era-warrior-fury", eraFuryFixtures.fresh60], ["era-mage-frost", eraFrostMageFixtures.fresh60],
    ["era-rogue-combat", eraCombatRogueFixtures.fresh60], ["era-hunter-marksman", eraMarksmanshipHunterFixtures.fresh60], ["era-priest-holy", eraHolyPriestFixtures.fresh60],
  ]);
  for (const [expectedKey, fixture] of fixtures) {
    const own = getCharacterRecommendationSupport(fixture);
    assert.equal(own.supported && own.specKey, expectedKey);
    for (const other of recommendationSpecManifests.filter((manifest) => manifest.key !== expectedKey)) {
      assert.equal(getCharacterRecommendationSupport({ ...fixture, class: other.className }).supported, false, `${expectedKey} resolved after class changed to ${other.className}`);
      assert.equal(getCharacterRecommendationSupport({ ...fixture, spec: other.specName }).supported, false, `${expectedKey} resolved after spec changed to ${other.specName}`);
    }
  }
});

test("all manifests validate and snapshots serialize deterministically", () => {
  for (const manifest of recommendationSpecManifests) {
    assert.equal(validateSpec(manifest).filter((issue) => issue.severity === "blocker").length, 0, manifest.key);
    for (const phase of manifest.phases) assert.equal(buildSpecSnapshot(manifest, phase).serialized, buildSpecSnapshot(manifest, phase).serialized, phase.datasetVersion);
  }
});
