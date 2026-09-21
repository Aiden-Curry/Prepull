import test from "node:test";
import assert from "node:assert/strict";
import { warriorTalents } from "../lib/talents/warrior.ts";
import { furyGuideBuild } from "../lib/talents/builds.ts";
import { talentAllocation, validateTalentBuild } from "../lib/talents/registry.ts";
import { guideContent } from "../lib/guides/content.ts";

test("verified Classic Warrior metadata and complete legal Fury allocation", () => {
  assert.equal(warriorTalents.talents.length, 52);
  assert.deepEqual(talentAllocation(warriorTalents, furyGuideBuild), [17, 34, 0]);
  assert.deepEqual(validateTalentBuild(warriorTalents, furyGuideBuild), []);
  const flurry = warriorTalents.talents.find(t => t.id === "flurry")!;
  assert.deepEqual([flurry.tree, flurry.row, flurry.column, flurry.maxRank, flurry.prerequisite], ["fury", 6, 3, 5, "enrage"]);
  assert.equal(warriorTalents.talents.find(t => t.id === "bloodthirst")!.spellIds[0], 23881);
  assert.equal(furyGuideBuild.selectedRanks.cruelty, 5);
  assert.equal(furyGuideBuild.selectedRanks.piercingHowl, undefined);
  assert.equal(warriorTalents.talents.filter(t => t.prerequisite).length, 9);
});
test("invalid ranks, tier gates, dependencies and totals are rejected", () => {
  for (const [changes, expected] of [
    [{ cruelty: 6 }, /Invalid selected rank/],
    [{ enrage: 4 }, /Unfilled prerequisite: flurry/],
    [{ improvedRend: 0 }, /Unfilled prerequisite: deepWounds/],
    [{ tacticalMastery: 0 }, /Locked row/],
    [{ invented: 1 }, /Unknown selected talent/],
    [{ cruelty: 4 }, /Invalid level-60 allocation/],
  ] as const) assert.ok(validateTalentBuild(warriorTalents, { ...furyGuideBuild, selectedRanks: { ...furyGuideBuild.selectedRanks, ...changes } }).some(e => expected.test(e)));
});
test("only Fury guide uses visual talents; other guide prose remains independent", () => {
  const owners = Object.entries(guideContent).filter(([, content]) => content.sections.some(s => s.blocks.some(b => b.kind === "talent-build"))).map(([id]) => id);
  assert.deepEqual(owners, ["era-fury"]);
});
