import assert from "node:assert/strict";
import test from "node:test";
import { eraFrostMageFixtures } from "../lib/gear-analysis/mage-fixtures.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { getCharacterRecommendationSupport, loadRecommendationProfile, recommendationRegistry, validateRecommendationRegistry } from "../lib/recommendations/registry.ts";

test("registry has one valid entry per content, class, and specialization", () => {
  assert.deepEqual(validateRecommendationRegistry(), []);
  const identities = recommendationRegistry.map((entry) => `${entry.contentVersion}:${entry.className.toLowerCase()}:${entry.specName.toLowerCase()}`);
  assert.equal(new Set(identities).size, identities.length);
});

test("support discovery resolves Fury and Frost without spec fallback", () => {
  assert.equal(getCharacterRecommendationSupport(eraFuryFixtures.fresh60).supported && getCharacterRecommendationSupport(eraFuryFixtures.fresh60).specKey, "era-warrior-fury");
  assert.equal(getCharacterRecommendationSupport(eraFrostMageFixtures.fresh60).supported && getCharacterRecommendationSupport(eraFrostMageFixtures.fresh60).specKey, "era-mage-frost");
  assert.equal(getCharacterRecommendationSupport({ ...eraFrostMageFixtures.fresh60, spec: "Fire" }).supported, false);
  assert.equal(getCharacterRecommendationSupport({ ...eraFuryFixtures.fresh60, class: "Mage" }).supported, false);
});

test("registered datasets remain isolated by specialization", () => {
  const fury = loadRecommendationProfile(recommendationRegistry[0]);
  const frost = loadRecommendationProfile(recommendationRegistry[1]);
  assert.ok(fury.sets.every((set) => set.className.toLowerCase() === "warrior" && set.specialization.toLowerCase() === "fury"));
  assert.ok(frost.sets.every((set) => set.className.toLowerCase() === "mage" && set.specialization.toLowerCase() === "frost"));
  const furyIds = new Set(fury.sets.flatMap((set) => Object.values(set.slots).flatMap((items) => (items ?? []).map((item) => item.itemId))));
  const frostIds = new Set(frost.sets.flatMap((set) => Object.values(set.slots).flatMap((items) => (items ?? []).map((item) => item.itemId))));
  assert.equal([...frostIds].some((id) => furyIds.has(id)), false);
});

test("registry validation rejects duplicates and invalid dataset registration", () => {
  const fury = recommendationRegistry[0];
  const frost = recommendationRegistry[1];
  assert.ok(validateRecommendationRegistry([frost, frost]).some((issue) => /Duplicate recommendation/.test(issue)));
  assert.ok(validateRecommendationRegistry([{ ...frost, setIdByPhase: { ...frost.setIdByPhase, 1: "missing" } }]).some((issue) => /missing its Phase 1 dataset/.test(issue)));
  assert.ok(validateRecommendationRegistry([{ ...frost, contentVersion: "tbc" }]).some((issue) => /content version|metadata does not match/.test(issue)));
  assert.ok(validateRecommendationRegistry([{ ...frost, specName: "Fire" }]).some((issue) => /profile identity|dataset metadata/.test(issue)));
  assert.ok(validateRecommendationRegistry([{ ...frost, availablePhases: [0, 2], setIdByPhase: { 0: "era-frost-mage-pre-raid", 2: "era-frost-mage-phase-1" } }]).some((issue) => /Phase 2 dataset metadata/.test(issue)));
  assert.ok(validateRecommendationRegistry([{ ...fury, candidates: frost.candidates }]).some((issue) => /candidate .*content\/class/.test(issue)));
  assert.ok(validateRecommendationRegistry([{ ...frost, candidates: fury.candidates }]).some((issue) => /candidate .*content\/class/.test(issue)));
});
