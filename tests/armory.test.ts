import assert from "node:assert/strict";
import test from "node:test";
import fixture from "./fixtures/classic-armory.json" with { type: "json" };
import { normalizeEquipment } from "../lib/armory/equipment.ts";
import { normalizeStatistics, normalizeTalentState, relevantStatistics } from "../lib/armory/normalize.ts";
import { projectArmory } from "../lib/armory/projection.ts";
import { wowheadDataset, wowheadItemParams, isTrustedArmoryIcon } from "../lib/armory/wowhead.ts";
import type { NormalizedCharacter } from "../lib/types.ts";
const now = "2026-09-16T12:00:00.000Z";
const character: NormalizedCharacter = { id: "private-provider-id", name: "Example", region: "eu", realm: "Firemaw", realmType: "era", contentVersion: "era", level: 60, class: "Warrior", race: "Orc", faction: "Horde", spec: "Fury", professions: [], equipment: [] };
test("provider slots retain separate rings, trinkets, weapons and cosmetic slots without generic duplication", () => {
  const slots = ["FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2", "MAIN_HAND", "OFF_HAND", "RELIC", "SHIRT", "TABARD", "FINGER", "FINGER_1"];
  const equipment = normalizeEquipment({ equipped_items: slots.map((type, index) => ({ slot: { type }, item: { id: index + 1 } })) });
  assert.equal(equipment.length, 9); assert.equal(equipment.find((item) => item.slot === "Finger 2")?.itemId, 2); assert.equal(equipment.find((item) => item.slot === "Ranged / Relic")?.itemId, 7);
  const sheet = projectArmory({ ...character, equipment }, now); assert.equal(sheet.equipment.length, 19); assert.equal(sheet.equipment.find((slot) => slot.slot === "head")?.item, undefined);
});
test("equipment retains known quality, modifiers and safe imagery; absent quality remains unknown", () => {
  const [item] = normalizeEquipment({ equipped_items: [{ slot: { type: "HEAD" }, item: { id: 123 }, quality: { type: "EPIC" }, level: { value: 66 }, enchantments: [{ enchantment_id: 2583, display_string: "Stamina" }], sockets: [{ item: { id: 23121 } }], media: { assets: [{ key: "icon", value: "http://localhost/secret" }] } }] });
  assert.equal(item.quality, "Epic"); assert.deepEqual(item.enchantIds, [2583]); assert.deepEqual(item.gemIds, [23121]); assert.equal(item.icon, ""); assert.equal(item.itemLevel, 66);
  assert.equal(normalizeEquipment({ equipped_items: [{ slot: { type: "HEAD" }, item: { id: 1 } }] })[0].quality, "Unknown");
});
test("live Classic statistics shape normalizes finite values and preserves zero without invented stats", () => {
  const stats = normalizeStatistics(fixture.statistics, now); assert.equal(stats.status, "available"); if (stats.status !== "available") return;
  assert.equal(stats.values.find((stat) => stat.key === "health")?.value, 8669); assert.equal(stats.values.find((stat) => stat.key === "defense")?.value, 361);
  assert.equal(stats.values.find((stat) => stat.key === "spell_power")?.value, 0);
  assert.ok(!relevantStatistics(stats.values, "Warrior").some((stat) => stat.key === "spell_power"));
  assert.ok(!relevantStatistics(stats.values, "Priest").some((stat) => stat.key === "attack_power"));
  assert.equal(normalizeStatistics({ health: NaN, armor: { effective: "900" } }, now).status, "unavailable");
});
test("observed Classic active talent shape uses explicit talent_rank and spell_tooltip, not inactive spec or default builds", () => {
  const talents = normalizeTalentState(fixture.specializations, now); assert.equal(talents.status, "available"); if (talents.status !== "available") return;
  assert.deepEqual(talents.trees.map((tree) => [tree.name, tree.points]), [["Protection", 16], ["Fury", 32], ["Arms", 3]]);
  assert.equal(talents.trees[0].selections[0].spellId, 12753); assert.equal(talents.trees[0].selections[0].rank, 5);
  assert.equal(normalizeTalentState({ specialization_groups: [{ is_active: true, specializations: [{ specialization_name: "Fury", spent_points: 34 }] }] }, now).status, "unavailable");
  assert.doesNotMatch(JSON.stringify(talents), /column|tier|maxRank|position/);
});
test("public armory projection excludes identity and nested extras, retains useful equipment during optional failure", () => {
  const source = { ...character, userId: "private", equipment: normalizeEquipment(fixture.equipment), armory: { statistics: { status: "temporary-error" as const }, talents: { status: "unavailable" as const, reason: "unsupported" as const } } };
  const projection = projectArmory(source, now); assert.equal(projection.equipmentStatus, "available"); assert.equal(projection.statistics.status, "temporary-error");
  assert.ok(projection.equipment.some((slot) => slot.item)); assert.doesNotMatch(JSON.stringify(projection), /private|userId|syncId|_links|source_item|spell_tooltip/);
  assert.equal(projectArmory(character, now).talents.status, "unavailable");
});
test("Wowhead routing follows ecosystem even under a different content tab and sends real modifier IDs", () => {
  assert.equal(wowheadDataset("tbc", "era"), "classic"); assert.equal(wowheadDataset("era", "anniversary"), "tbc");
  const params = new URLSearchParams(wowheadItemParams("tbc", "anniversary", { itemId: 123, name: "item", enchantments: [], enchantIds: [2583], gemIds: [23121, 23122] }));
  assert.equal(params.get("domain"), "tbc"); assert.equal(params.get("ench"), "2583"); assert.equal(params.get("gems"), "23121:23122");
  for (const value of ["https://evil.test/a.png", "https://wow.zamimg.com.evil.test/images/wow/icons/large/a.jpg", "https://user@wow.zamimg.com/images/wow/icons/large/a.jpg", "data:image/svg+xml,hello"]) assert.equal(isTrustedArmoryIcon(value), false);
  assert.equal(isTrustedArmoryIcon("https://wow.zamimg.com/images/wow/icons/large/inv_helmet_09.jpg"), true);
});
