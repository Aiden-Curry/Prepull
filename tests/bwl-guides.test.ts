import test from "node:test";
import assert from "node:assert/strict";
import { ERA_RAIDS } from "../lib/warcraft-logs/registry.ts";
import { bossGuide, guideRegistry, publicGuidePaths, raidGuide, raidProgressionEncounters, resolveGuide } from "../lib/guides/registry.ts";
import { validateGuides } from "../lib/guides/validate.ts";

test("BWL overview maps to the accepted eight encounters and excludes the alternate", () => {
  const raid = ERA_RAIDS.find(raid => raid.id === 2002)!;
  const encounters = raidProgressionEncounters("era", raid.id);
  assert.equal(encounters.length, 8);
  assert.deepEqual(encounters, raid.encounters.filter(boss => boss.progression).sort((a, b) => a.order - b.order));
  assert.equal(raid.encounters.find(boss => boss.id === 50631)?.progression, false);
  assert.ok(!encounters.map(boss => Number(boss.id)).includes(50631));
  assert.equal(raidGuide("era", 2002)?.id, "era-blackwing-lair");
  assert.equal(resolveGuide("era", "raids/blackwing-lair")?.status, "published");
  assert.ok(publicGuidePaths().includes("/era/guides/raids/blackwing-lair"));
  assert.ok(!publicGuidePaths().some(path => path.startsWith("/era/guides/raids/blackwing-lair/")));
  for (const encounter of raid.encounters) assert.equal(bossGuide("era", raid.id, encounter.id), undefined);
  assert.equal(raidGuide("tbc", 2002), undefined);
  assert.deepEqual(raidProgressionEncounters("tbc", 2002), []);
});

test("overview coverage permits missing articles but retains identity and complete-raid checks", () => {
  assert.deepEqual(validateGuides(), []);
  const wrongZone = guideRegistry.map(guide => guide.id === "era-blackwing-lair" ? { ...guide, raidId: 2000 } : guide);
  assert.ok(validateGuides(wrongZone).some(error => error.includes("BWL must resolve")));
  const firstBoss = guideRegistry.find(guide => guide.type === "boss")!;
  assert.ok(validateGuides(guideRegistry.filter(guide => guide.id !== firstBoss.id)).some(error => error.includes("missing or duplicate boss coverage")));
  const requireComplete = guideRegistry.map(guide => guide.id === "era-blackwing-lair" && guide.type === "raid" ? { ...guide, bossCoverage: "complete" as const } : guide);
  assert.equal(validateGuides(requireComplete).filter(error => error.includes("missing or duplicate boss coverage")).length, 8);
  const invalidBoss = { ...firstBoss, id: "invalid-alternate", slug: "raids/blackwing-lair/alternate", raidId: 2002, encounterId: 50631 };
  assert.ok(validateGuides([...guideRegistry, invalidBoss]).some(error => error.includes("unknown progression encounter")));
});
