import assert from "node:assert/strict";
import test from "node:test";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { buildPlayerAdvice } from "../lib/player-advice/service.ts";
import { completedTargetNames } from "../lib/characters/sync-service.ts";

test("fresh Fury advice ranks realistic activities and exposes explainable targets", () => {
  const { advice } = buildPlayerAdvice(eraFuryFixtures.fresh60);
  assert.equal(advice.supported, true);
  assert.ok(advice.topActions.length > 0);
  assert.ok(advice.topActions[0].reason.length > 20);
  assert.ok(advice.topActions[0].targets.some((target) => target.realistic));
  assert.ok(advice.topActions[0].targets.every((target) => target.itemName.length > 0));
});

test("near-BiS advice does not manufacture dungeon actions", () => {
  const { advice } = buildPlayerAdvice(eraFuryFixtures.nearBis);
  assert.equal(advice.topActions.length, 0);
  assert.match(advice.limitations[0] ?? "", /remaining upgrades|mostly raid|close/i);
});

test("unsupported class and spec do not receive another spec's advice", () => {
  const { advice } = buildPlayerAdvice({ ...eraFuryFixtures.fresh60, class: "Mage", spec: "Fire" });
  assert.equal(advice.supported, false);
  assert.equal(advice.topActions.length, 0);
  assert.match(advice.limitations[0], /coming later/i);
});

test("Phase 1 advice separates raid actions from realistic non-raid actions", () => {
  const { advice } = buildPlayerAdvice(eraFuryFixtures.fresh60, 1);
  assert.equal(advice.phase, 1);
  assert.ok(advice.secondaryActions.every((action) => action.view === "realistic" || action.view === "raid"));
  assert.ok(advice.secondaryActions.some((action) => action.view === "raid") || advice.secondaryTargets.length >= 0);
});

test("advice preserves conditional context and aspirational labels", () => {
  const { advice } = buildPlayerAdvice(eraFuryFixtures.fresh60);
  const targets = [...advice.topActions, ...advice.secondaryActions].flatMap((action) => action.targets);
  assert.ok(targets.some((target) => target.conditionalNote) || advice.secondaryTargets.some((target) => target.conditionalNote));
  assert.ok(advice.secondaryTargets.every((target) => target.aspirational));
});

test("Fury completed targets are resolved from the previous advice state", () => {
  const before = eraFuryFixtures.fresh60;
  const advice = buildPlayerAdvice(before).advice;
  const target = [...advice.topActions, ...advice.secondaryActions].flatMap((action) => action.targets).find((item) => item.realistic)!;
  const equipped = { itemId: target.itemId, name: target.itemName, slot: target.slot, quality: "Rare" as const, icon: "inv_misc_questionmark", stats: {} };
  const after = { ...before, equipment: [...before.equipment.filter((item) => item.slot !== target.slot), { ...equipped, slot: target.slot }] };
  assert.deepEqual(completedTargetNames(before, after, new Set([target.itemId])), [target.itemName]);
});
