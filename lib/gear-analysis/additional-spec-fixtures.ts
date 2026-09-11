import type { EquipmentSlot, EquippedItem, Faction, NormalizedCharacter, Region } from "../types.ts";
import { eraCombatRogueCandidates, eraHolyPriestCandidates, eraMarksmanshipHunterCandidates } from "./additional-spec-datasets.ts";
import type { CuratedCandidate } from "./types.ts";

const slots: EquipmentSlot[] = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"];
const starter = (prefix: number, label: string, slot: EquipmentSlot): EquippedItem => ({ itemId: prefix + slots.indexOf(slot), name: `Fresh 60 ${label} ${slot}`, slot, quality: "Uncommon", stats: {}, icon: label.slice(0, 2).toUpperCase() });
const clone = (item: CuratedCandidate): EquippedItem => ({ ...item, stats: { ...item.stats }, source: item.source ? { ...item.source } : undefined });

function fixtures(options: { id: string; label: string; className: string; specName: string; race: string; faction: Faction; region: Region; realm: string; candidates: CuratedCandidate[]; prefix: number; professions: string[] }) {
  const freshEquipment = slots.map((slot) => starter(options.prefix, options.label, slot));
  const preRaid = options.candidates.filter((item) => item.availability.phase === 0);
  const firstFor = (slot: EquipmentSlot) => preRaid.find((item) => item.slot === slot);
  const build = (name: string, equipment: EquippedItem[]): NormalizedCharacter => ({ id: `${options.id}-${name.toLowerCase().replaceAll(" ", "-")}`, name, region: options.region, realm: options.realm, contentVersion: "era", realmType: "era", level: 60, race: options.race, class: options.className, spec: options.specName, faction: options.faction, professions: options.professions, equipment });
  const replace = (equipment: EquippedItem[], replacements: Array<CuratedCandidate | undefined>) => equipment.map((item) => replacements.find((candidate) => candidate?.slot === item.slot) ? clone(replacements.find((candidate) => candidate?.slot === item.slot)!) : item);
  const partial = replace(freshEquipment, [firstFor("Head"), firstFor("Hands"), firstFor("Finger 1"), firstFor("Ranged / Relic")]);
  const mainHand = firstFor("Main Hand");
  const nearReference = slots.flatMap((slot) => slot === "Off Hand / Shield" && mainHand?.weaponRole?.hand === "two-hand" ? [] : [firstFor(slot) ? clone(firstFor(slot)!) : starter(options.prefix, options.label, slot)]);
  return { fresh60: build(`Fresh ${options.label}`, freshEquipment), partial: build(`Partial ${options.label}`, partial), nearReference: build(`Near ${options.label} Reference`, nearReference) };
}

export const eraCombatRogueFixtures = fixtures({ id: "era-rogue", label: "Combat", className: "Rogue", specName: "Combat", race: "Human", faction: "Alliance", region: "eu", realm: "Firemaw", candidates: eraCombatRogueCandidates, prefix: 720000, professions: ["Engineering", "Leatherworking"] });
export const eraMarksmanshipHunterFixtures = fixtures({ id: "era-hunter", label: "Marks", className: "Hunter", specName: "Marksmanship", race: "Orc", faction: "Horde", region: "us", realm: "Whitemane", candidates: eraMarksmanshipHunterCandidates, prefix: 730000, professions: ["Engineering", "Leatherworking"] });
export const eraHolyPriestFixtures = fixtures({ id: "era-priest", label: "Holy", className: "Priest", specName: "Holy", race: "Human", faction: "Alliance", region: "eu", realm: "Firemaw", candidates: eraHolyPriestCandidates, prefix: 740000, professions: ["Tailoring", "Enchanting"] });
