import test from "node:test";
import assert from "node:assert/strict";
import { warriorTalents } from "../lib/talents/warrior.ts";
import { furyGuideBuild } from "../lib/talents/builds.ts";
import { talentAllocation, validateTalentBuild } from "../lib/talents/registry.ts";
import { guideContent } from "../lib/guides/content.ts";
import { mageTalents } from "../lib/talents/mage.ts";
import { frostGuideBuilds } from "../lib/talents/mage-builds.ts";
import { rogueTalents } from "../lib/talents/rogue.ts";
import { combatGuideBuilds } from "../lib/talents/rogue-builds.ts";
import { hunterTalents } from "../lib/talents/hunter.ts";
import { marksmanshipGuideBuilds } from "../lib/talents/hunter-builds.ts";

test("complete Hunter metadata and two useful legal Marksmanship builds", () => {
  assert.equal(hunterTalents.talents.length, 46);
  assert.deepEqual(hunterTalents.trees.map(t => t.name), ["Beast Mastery", "Marksmanship", "Survival"]);
  assert.deepEqual(hunterTalents.talents.find(t => t.id === "deflection")!.spellIds, [19295, 19297, 19298, 19301, 19300]);
  for (const [index, build] of marksmanshipGuideBuilds.entries()) {
    assert.deepEqual(validateTalentBuild(hunterTalents, build), []);
    assert.deepEqual(talentAllocation(hunterTalents, build), index ? [2, 31, 18] : [20, 31, 0]);
    assert.equal(Object.values(build.selectedRanks).reduce((a, b) => a + b, 0), 51);
    assert.equal(build.selectedRanks.trueshotAura, 1);
  }
  assert.equal(marksmanshipGuideBuilds[1].selectedRanks.surefooted, 3);
  const build = marksmanshipGuideBuilds[0];
  const dependency = hunterTalents.talents.find(t => t.prerequisite && build.selectedRanks[t.id])!;
  assert.ok(validateTalentBuild(hunterTalents, { ...build, selectedRanks: { ...build.selectedRanks, [dependency.prerequisite!]: 0 } }).some(e => e.includes("Unfilled prerequisite")));
  assert.ok(validateTalentBuild(hunterTalents, { ...build, selectedRanks: { trueshotAura: 1 } }).some(e => e.includes("Locked row")));
});

test("complete Classic Rogue metadata and legal weapon-specific raid builds", () => {
  assert.equal(rogueTalents.talents.length, 51);
  assert.deepEqual(rogueTalents.talents.find(t => t.id === "improvedGouge")!.spellIds, [13741, 13793, 13792]);
  assert.deepEqual(rogueTalents.trees.map(t => t.name), ["Assassination", "Combat", "Subtlety"]);
  for (const [index, build] of combatGuideBuilds.entries()) {
    assert.deepEqual(validateTalentBuild(rogueTalents, build), []);
    assert.deepEqual(talentAllocation(rogueTalents, build), index ? [15, 31, 5] : [19, 32, 0]);
    assert.equal(Object.values(build.selectedRanks).reduce((a, b) => a + b, 0), 51);
  }
  const [swords, daggers] = combatGuideBuilds;
  assert.equal(swords.selectedRanks.swordSpecialization, 5);
  assert.equal(swords.selectedRanks.daggerSpecialization, undefined);
  assert.equal(daggers.selectedRanks.daggerSpecialization, 5);
  assert.equal(daggers.selectedRanks.swordSpecialization, undefined);
  assert.equal(daggers.selectedRanks.improvedBackstab, 3);
  assert.equal(daggers.selectedRanks.opportunity, 5);
  assert.equal(swords.selectedRanks.relentlessStrikes, 1);
  assert.equal(daggers.selectedRanks.relentlessStrikes, undefined);
  const dependency = rogueTalents.talents.find(t => t.prerequisite && swords.selectedRanks[t.id]);
  assert.ok(dependency?.prerequisite);
  assert.ok(validateTalentBuild(rogueTalents, { ...swords, selectedRanks: { ...swords.selectedRanks, [dependency.prerequisite]: 0 } }).some(e => e.includes("Unfilled prerequisite")));
  assert.ok(validateTalentBuild(rogueTalents, { ...swords, selectedRanks: { adrenalineRush: 1 } }).some(e => e.includes("Locked row")));
});

test("complete Classic Mage metadata and both legal sourced Frost builds", () => {
  assert.equal(mageTalents.talents.length, 49);
  assert.deepEqual(mageTalents.trees.map(t => t.name), ["Arcane", "Fire", "Frost"]);
  for (const [index, build] of frostGuideBuilds.entries()) {
    assert.deepEqual(validateTalentBuild(mageTalents, build), []);
    assert.deepEqual(talentAllocation(mageTalents, build), index ? [16, 0, 35] : [31, 0, 20]);
    assert.equal(Object.values(build.selectedRanks).reduce((a, b) => a + b, 0), 51);
  }
  assert.equal(frostGuideBuilds[0].selectedRanks.arcanePower, 1);
  assert.equal(frostGuideBuilds[1].selectedRanks.wintersChill, 5);
  assert.equal(mageTalents.talents.find(t => t.id === "iceBarrier")!.prerequisite, "iceBlock");
  assert.ok(validateTalentBuild(mageTalents, { ...frostGuideBuilds[0], selectedRanks: { ...frostGuideBuilds[0].selectedRanks, arcaneInstability: 2 } }).some(e => e.includes("Unfilled prerequisite: arcanePower")));
});

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
test("only the four accepted spec guides use visual talents", () => {
  const owners = Object.entries(guideContent).filter(([, content]) => content.sections.some(s => s.blocks.some(b => b.kind === "talent-build"))).map(([id]) => id);
  assert.deepEqual(owners, ["era-fury", "era-frost", "era-combat", "era-marksmanship"]);
});
