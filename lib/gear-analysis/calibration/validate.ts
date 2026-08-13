import type { EquippedItem } from "../../types.ts";
import { eraFuryCandidates } from "../dataset.ts";
import { furyCalibrationFixtures } from "./fixtures.ts";
import type { CalibrationCase, CalibrationReadiness, CalibrationScenario } from "./types.ts";

const synthetic = new Set([999999, 300001, 300003]);
const expected: Record<number, { name: string; slot: string }> = { 16865: { name: "Breastplate of Might", slot: "Chest" }, 12618: { name: "Breastplate of the Chromatic Flight", slot: "Chest" }, 16966: { name: "Breastplate of Wrath", slot: "Chest" }, 11726: { name: "Savage Gladiator Chain", slot: "Chest" }, 18404: { name: "Onyxia Tooth Pendant", slot: "Neck" }, 19577: { name: "Rage of Mugamba", slot: "Neck" }, 19137: { name: "Onslaught Girdle", slot: "Waist" }, 18393: { name: "Warpwood Binding", slot: "Waist" }, 17075: { name: "Vis'kag the Bloodletter", slot: "Main Hand" }, 18832: { name: "Brutality Blade", slot: "Main Hand" }, 12939: { name: "Dal'Rend's Tribal Guardian", slot: "Off Hand / Shield" }, 23577: { name: "The Hungering Cold", slot: "Main Hand" }, 11815: { name: "Hand of Justice", slot: "Trinket 2" }, 18466: { name: "Royal Seal of Eldre'Thalas", slot: "Trinket 2" }, 22416: { name: "Dreadnaught Breastplate", slot: "Chest" } };
const requiredSlots = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"];
const generic = /fresh 60|record exact|fixture-derived|consistent raid|generic|unknown item|future phase|tbd|---/i;
const numberStat = (entry: EquippedItem, key: string) => Number.parseFloat(entry.stats[key]?.replace("%", "") ?? "0") || 0;
const weaponSkill = (race: string, weapon: EquippedItem) => { const type = weapon.weapon?.weaponType ?? ""; const racial = race === "Orc" && type.includes("Axe") ? 5 : race === "Human" && (type.includes("Sword") || type.includes("Mace")) ? 5 : 0; return 300 + racial + (weapon.weapon?.weaponSkillBonus ?? 0); };
const setCounts = (equipment: EquippedItem[]) => equipment.reduce<Record<string, number>>((counts, entry) => { if (entry.setId) counts[entry.setId] = (counts[entry.setId] ?? 0) + 1; return counts; }, {});
const setPieces = (equipment: EquippedItem[]) => Object.entries(setCounts(equipment)).map(([id, count]) => `${id === "wrath" ? "Battlegear of Wrath" : id === "dalrends" ? "Dal'Rend's Arms" : id}: ${count}/${id === "wrath" ? 8 : 2}`).sort();
const activeSets = (equipment: EquippedItem[]) => { const counts = setCounts(equipment); const active: string[] = []; if ((counts.wrath ?? 0) >= 2) active.push("Battlegear of Wrath 2-piece: profile-modeled +35 score"); if ((counts.wrath ?? 0) >= 4) active.push("Battlegear of Wrath 4-piece: profile-modeled +75 score"); return active; };
type EraTalent = { maxRank: number; tier: number; tree: "Arms" | "Fury" | "Protection"; prerequisites?: Record<string, number> };
const eraWarriorTalents: Record<string, EraTalent> = {
  "Improved Heroic Strike": { maxRank: 3, tier: 1, tree: "Arms" }, "Improved Rend": { maxRank: 3, tier: 1, tree: "Arms" }, "Tactical Mastery": { maxRank: 5, tier: 2, tree: "Arms" }, "Anger Management": { maxRank: 1, tier: 3, tree: "Arms", prerequisites: { "Tactical Mastery": 5 } }, "Deep Wounds": { maxRank: 3, tier: 3, tree: "Arms", prerequisites: { "Improved Rend": 3 } }, Impale: { maxRank: 2, tier: 4, tree: "Arms", prerequisites: { "Deep Wounds": 3 } },
  Cruelty: { maxRank: 5, tier: 1, tree: "Fury" }, "Unbridled Wrath": { maxRank: 5, tier: 1, tree: "Fury" }, "Improved Cleave": { maxRank: 3, tier: 2, tree: "Fury" }, "Piercing Howl": { maxRank: 1, tier: 2, tree: "Fury" }, "Improved Berserker Rage": { maxRank: 2, tier: 3, tree: "Fury" }, Enrage: { maxRank: 5, tier: 3, tree: "Fury" }, Flurry: { maxRank: 5, tier: 3, tree: "Fury" }, "Dual Wield Specialization": { maxRank: 5, tier: 4, tree: "Fury" }, "Improved Execute": { maxRank: 2, tier: 4, tree: "Fury" }, Bloodthirst: { maxRank: 1, tier: 5, tree: "Fury" }, "Death Wish": { maxRank: 1, tier: 5, tree: "Fury" },
};
const parsedTalents = (talents: string) => talents.split(";").map((treeText) => { const header = treeText.slice(0, treeText.indexOf(":")).trim(); const tree = (header.match(/^(Arms|Fury|Protection)/)?.[1] ?? "") as EraTalent["tree"]; const declared = Number(header.match(/\((\d+) points\)/)?.[1] ?? 0); const entries = [...treeText.slice(treeText.indexOf(":") + 1).matchAll(/([^,;]+?)\s+(\d+)\/(\d+)/g)].map((match) => ({ name: match[1].trim(), rank: Number(match[2]), maxRank: Number(match[3]) })); return { tree, declared, entries }; });
const talentRanks = (talents: string) => parsedTalents(talents).reduce((total, tree) => total + tree.entries.reduce((sum, entry) => sum + entry.rank, 0), 0);
export function validateEraWarriorTalents(scenario: CalibrationScenario) {
  const issues: { code: string; message: string }[] = [];
  const invested = new Set<string>();
  for (const parsed of parsedTalents(scenario.talents)) {
    const lowerTierPoints = (tier: number) => parsed.entries.filter((entry) => (eraWarriorTalents[entry.name]?.tree === parsed.tree) && (eraWarriorTalents[entry.name]?.tier ?? 0) < tier).reduce((sum, entry) => sum + entry.rank, 0);
    const treePoints = parsed.entries.reduce((sum, entry) => sum + entry.rank, 0);
    if (parsed.declared !== treePoints) issues.push({ code: "talent-tree-points", message: `${parsed.tree} declares ${parsed.declared} points but lists ${treePoints}.` });
    for (const entry of parsed.entries) {
      const name = entry.name; const rank = entry.rank; const maxRank = entry.maxRank;
      if (name.toLowerCase() === "none") continue;
      if (invested.has(name)) issues.push({ code: "duplicate-talent", message: `Talent ${name} is listed more than once.` });
      invested.add(name);
      const definition = eraWarriorTalents[name];
      if (definition === undefined) issues.push({ code: "invalid-era-talent", message: `${name} is not a valid Classic Era Warrior talent.` });
      else if (definition.tree !== parsed.tree) issues.push({ code: "invalid-talent-tree", message: `${name} belongs to ${definition.tree}, not ${parsed.tree}.` });
      else if (maxRank !== definition.maxRank || rank < 0 || rank > maxRank) issues.push({ code: "invalid-talent-rank", message: `${name} has invalid rank ${rank}/${maxRank}; Era maximum is ${definition.maxRank}.` });
      else {
        if (definition.tier > 1 && lowerTierPoints(definition.tier) < (definition.tier - 1) * 5) issues.push({ code: "invalid-talent-prerequisite", message: `${name} is in tier ${definition.tier} but its tree has only ${lowerTierPoints(definition.tier)} prior points.` });
        if (definition.prerequisites && Object.entries(definition.prerequisites).some(([prerequisite, requiredRank]) => (parsed.entries.find((entry) => entry.name === prerequisite)?.rank ?? 0) < requiredRank)) issues.push({ code: "invalid-direct-prerequisite", message: `${name} requires ${Object.entries(definition.prerequisites).map(([prerequisite, requiredRank]) => `${prerequisite} ${requiredRank}/${requiredRank}`).join(", ")}.` });
      }
    }
  }
  if (talentRanks(scenario.talents) !== 51 || scenario.talentPoints !== 51) issues.push({ code: "talent-points", message: "Complete talent allocation must total exactly 51 points." });
  return issues;
}
const swapped = (fixture: typeof furyCalibrationFixtures[number], caseData: CalibrationCase, itemId: number) => { const candidate = eraFuryCandidates.find((entry) => entry.itemId === itemId); return candidate ? fixture.character.equipment.map((entry) => entry.slot === caseData.slot ? { ...candidate, slot: caseData.slot } : entry) : fixture.character.equipment; };

export function validateCalibrationCase(caseData: CalibrationCase): CalibrationReadiness {
  const issues: { code: string; message: string }[] = [];
  const fixture = furyCalibrationFixtures.find((entry) => entry.name === caseData.characterFixture);
  const candidates = new Map(eraFuryCandidates.map((entry) => [entry.itemId, entry]));
  const a = candidates.get(caseData.itemA); const b = candidates.get(caseData.itemB);
  if (!fixture) issues.push({ code: "missing-fixture", message: `Fixture ${caseData.characterFixture} does not exist.` });
  if (caseData.itemA === caseData.itemB) issues.push({ code: "same-candidate", message: "Candidate A and B are the same item." });
  for (const id of [caseData.itemA, caseData.itemB]) {
    if (synthetic.has(id) || id >= 900000) issues.push({ code: "synthetic-item", message: `Synthetic item #${id} is not externally simulatable.` });
    const actual = candidates.get(id); const audit = expected[id];
    if (!actual) { issues.push({ code: "missing-candidate", message: `Candidate #${id} is missing from the curated dataset.` }); continue; }
    if (!audit || actual.name !== audit.name || actual.slot !== audit.slot) issues.push({ code: "item-id-name-mismatch", message: `Candidate #${id} does not match the audited Classic item record.` });
    if (actual.availability.classes && !actual.availability.classes.includes("Warrior")) issues.push({ code: "class-restriction", message: `${actual.name} is not available to Warrior.` });
  }
  if (!fixture) return { ready: issues.length === 0, issues };
  const equipment = fixture.character.equipment; const scenario = fixture.scenario;
  for (const slot of requiredSlots) { const equipped = equipment.find((entry) => entry.slot === slot); if (!equipped || !equipped.itemId || equipped.itemId >= 900000 || generic.test(`${equipped.name} ${equipped.itemId}`)) issues.push({ code: "incomplete-loadout", message: `Exact real item is missing for ${slot}.` }); }
  const uniqueGroups = new Set<string>(); for (const equipped of equipment) { if (equipped.uniqueGroup && uniqueGroups.has(equipped.uniqueGroup)) issues.push({ code: "unique-conflict", message: `Unique group ${equipped.uniqueGroup} is equipped more than once.` }); if (equipped.uniqueGroup) uniqueGroups.add(equipped.uniqueGroup); }
  if (scenario.worldBuffs !== "NONE") issues.push({ code: "forbidden-world-buff", message: "Baseline calibration must use World buffs: NONE." });
  if (scenario.faction === "Horde" && /Blessing of|Might of Stormwind|Might of Stormwind/i.test(scenario.buffs)) issues.push({ code: "faction-buff", message: "Horde fixture contains Alliance-only or forbidden raid buffs." });
  if (scenario.faction === "Alliance" && /Windfury Totem/i.test(scenario.buffs)) issues.push({ code: "faction-buff", message: "Alliance fixture contains Windfury Totem." });
  if (/Mark of the Wild/i.test(scenario.buffs) && /Gift of the Wild/i.test(scenario.buffs)) issues.push({ code: "duplicate-buff", message: "Mark of the Wild and Gift of the Wild are duplicate Druid buff groups." });
  if (scenario.faction === "Horde" && (!/MH: Windfury Totem/i.test(scenario.weaponImbues) || /MH:\s*(?!Windfury)[^;]*Sharpening Stone/i.test(scenario.weaponImbues))) issues.push({ code: "weapon-imbue", message: "Horde Windfury configuration must not apply a conflicting MH stone." });
  if (scenario.faction === "Alliance" && /Windfury Totem/i.test(scenario.weaponImbues)) issues.push({ code: "weapon-imbue", message: "Alliance configuration must not use Windfury." });
  const effects = scenario.consumables.split(";").map((entry) => entry.trim().toLowerCase()).filter(Boolean); if (new Set(effects).size !== effects.length) issues.push({ code: "duplicate-consumable", message: "Consumables/effects contain duplicate entries." });
  issues.push(...validateEraWarriorTalents(scenario));
  const mh = equipment.find((entry) => entry.slot === "Main Hand")!; const oh = equipment.find((entry) => entry.slot === "Off Hand / Shield")!;
  const expectedMhSkill = weaponSkill(scenario.race, mh); const expectedOhSkill = weaponSkill(scenario.race, oh);
  if (scenario.mainHandWeaponSkill !== expectedMhSkill || scenario.offHandWeaponSkill !== expectedOhSkill) issues.push({ code: "weapon-skill", message: `Declared weapon skill differs from calculated skill (${expectedMhSkill}/${expectedOhSkill}).` });
  if (scenario.race === "Orc" && /Sword 30[5-9]/.test(scenario.weaponSkill) && !(mh.weapon?.weaponSkillBonus || oh.weapon?.weaponSkillBonus)) issues.push({ code: "racial-skill", message: "Orc sword skill incorrectly includes a racial sword bonus." });
  if (scenario.race === "Human" && /Sword 31/.test(scenario.weaponSkill) && !(mh.weapon?.weaponSkillBonus || oh.weapon?.weaponSkillBonus)) issues.push({ code: "racial-skill", message: "Human baseline sword skill is incorrectly above 305." });
  if (scenario.mainHand !== `${mh.name} (#${mh.itemId})` || scenario.offHand !== `${oh.name} (#${oh.itemId})`) issues.push({ code: "weapon-mismatch", message: "Scenario weapons do not match exact equipment." });
  if (JSON.stringify(scenario.setPiecesEquipped.slice().sort()) !== JSON.stringify(setPieces(equipment)) || JSON.stringify(scenario.activeSetBonuses.slice().sort()) !== JSON.stringify(activeSets(equipment))) issues.push({ code: "set-count", message: "Declared set pieces or active bonuses disagree with equipped item IDs." });
  for (const [key, expectedValue] of Object.entries({ strength: equipment.reduce((n, e) => n + numberStat(e, "Strength"), 0), agility: equipment.reduce((n, e) => n + numberStat(e, "Agility"), 0), hit: equipment.reduce((n, e) => n + numberStat(e, "Hit"), 0), crit: equipment.reduce((n, e) => n + numberStat(e, "Crit") + numberStat(e, "Critical strike"), 0) })) if (scenario[key as "strength" | "agility" | "hit" | "crit"] !== expectedValue) issues.push({ code: "derived-total", message: `Declared ${key} total does not match equipment.` });
  if (a && b && !caseData.tags.includes("set-bonus")) { const baseCounts = setCounts(equipment); for (const candidate of [a, b]) { const counts = setCounts(swapped(fixture, caseData, candidate.itemId)); for (const setId of new Set([...Object.keys(baseCounts), ...Object.keys(counts)])) for (const threshold of [2, 4, 8]) if ((baseCounts[setId] ?? 0) >= threshold !== (counts[setId] ?? 0) >= threshold) issues.push({ code: "unrelated-set-threshold", message: `Candidate ${candidate.itemId} changes the ${setId} ${threshold}-piece threshold unrelated to ${caseData.tags.join(", ")}.` }); } }
  return { ready: issues.length === 0, issues };
}

export function calibrationReadinessSummary(cases: CalibrationCase[]) { return cases.map((caseData) => ({ caseData, readiness: validateCalibrationCase(caseData) })); }
