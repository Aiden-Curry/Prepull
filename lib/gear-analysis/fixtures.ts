import type { EquipmentSlot, EquippedItem, NormalizedCharacter } from "../types.ts";
import { eraFuryCandidates } from "./dataset.ts";

const slots: EquipmentSlot[] = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"];
const starter = (slot: EquipmentSlot): EquippedItem => ({ itemId: 700000 + slots.indexOf(slot), name: `Fresh 60 ${slot}`, slot, quality: "Uncommon", stats: { Strength: "+5", Hit: slot === "Main Hand" ? "+2" : "+0" }, icon: "ST" });
const character = (name: string, equipment: EquippedItem[]): NormalizedCharacter => ({ id: `fixture-${name.toLowerCase().replaceAll(" ", "-")}`, name, region: "eu", realm: "Firemaw", contentVersion: "era", realmType: "era", level: 60, race: "Orc", class: "Warrior", spec: "Fury", faction: "Horde", professions: ["Mining", "Engineering"], equipment: [...new Map(equipment.map((item) => [item.slot, item])).values()] });
const copy = (item: EquippedItem): EquippedItem => ({ ...item, stats: { ...item.stats }, enchantments: item.enchantments ? [...item.enchantments] : undefined, weapon: item.weapon ? { ...item.weapon } : undefined });
const candidatesBy = (predicate: (item: (typeof eraFuryCandidates)[number]) => boolean) => eraFuryCandidates.filter(predicate).map(copy);
const sameFamily = (candidate: (typeof eraFuryCandidates)[number], slot: EquipmentSlot) => candidate.slot === slot || (candidate.weapon && ["Main Hand", "Off Hand / Shield"].includes(slot) && ["Main Hand", "Off Hand / Shield"].includes(candidate.slot)) || (["Finger 1", "Finger 2"].includes(slot) && ["Finger 1", "Finger 2"].includes(candidate.slot)) || (["Trinket 1", "Trinket 2"].includes(slot) && ["Trinket 1", "Trinket 2"].includes(candidate.slot));
const buildLoadout = (preferred: (candidate: (typeof eraFuryCandidates)[number]) => boolean) => { const used = new Set<string>(); return slots.map((slot) => { const options = eraFuryCandidates.filter((candidate) => sameFamily(candidate, slot)).sort((left, right) => (Number(preferred(right)) - Number(preferred(left))) || ((right.itemLevel ?? 0) - (left.itemLevel ?? 0))); const choice = options.find((candidate) => !used.has(`item:${candidate.itemId}`) && (!candidate.uniqueGroup || !used.has(`group:${candidate.uniqueGroup}`))); if (choice) { used.add(`item:${choice.itemId}`); if (choice.uniqueGroup) used.add(`group:${choice.uniqueGroup}`); return { ...copy(choice), slot }; } return starter(slot); }); };
const nearBisEquipment = buildLoadout(() => true);
const moltenCoreEquipment = buildLoadout((candidate) => candidate.source?.instance === "Molten Core" || candidate.source?.type === "Raid");

export const eraFuryFixtures = {
  fresh60: character("Fresh 60", slots.map(starter)),
  preRaid: character("Pre-Raid", [...slots.map(starter).filter((item) => !["Main Hand", "Off Hand / Shield", "Trinket 1"].includes(item.slot)), ...candidatesBy((item) => ["Dungeon", "Quest", "Profession"].includes(item.source?.type ?? ""))]),
  moltenCore: character("Molten Core", moltenCoreEquipment),
  bwlAq: character("BWL AQ", [...slots.map(starter).filter((item) => !["Head", "Chest", "Neck", "Shoulder", "Legs", "Feet", "Main Hand", "Off Hand / Shield"].includes(item.slot)), ...candidatesBy((item) => ["Blackwing Lair", "Ahn'Qiraj", "Zul'Gurub"].includes(item.source?.instance ?? ""))]),
  nearBis: character("Near BiS", nearBisEquipment),
};
