import type { EquipmentSlot, EquippedItem, NormalizedCharacter } from "../types.ts";
import { eraFrostMageCandidates } from "./mage-dataset.ts";

const slots: EquipmentSlot[] = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"];
const starter = (slot: EquipmentSlot): EquippedItem => ({ itemId: 710000 + slots.indexOf(slot), name: `Fresh 60 Frost ${slot}`, slot, quality: "Uncommon", stats: {}, icon: "FM" });
const preRaid = eraFrostMageCandidates.filter((item) => item.availability.phase === 0 && item.isRealistic !== false);
const pick = (slot: EquipmentSlot, id?: number) => preRaid.find((item) => id ? item.itemId === id : item.slot === slot);
const replace = (equipment: EquippedItem[], replacements: Array<EquippedItem | undefined>) => equipment.map((item) => replacements.find((candidate) => candidate?.slot === item.slot) ?? item);
const character = (name: string, equipment: EquippedItem[]): NormalizedCharacter => ({ id: `era-mage-${name.toLowerCase().replaceAll(" ", "-")}`, name, region: "us", realm: "Whitemane", contentVersion: "era", realmType: "era", level: 60, race: "Human", class: "Mage", spec: "Frost", faction: "Alliance", professions: ["Tailoring", "Enchanting"], equipment });

const fresh = slots.map(starter);
const partial = replace(fresh, [pick("Head"), pick("Shoulder"), pick("Hands"), pick("Main Hand", 13964), pick("Off Hand / Shield")]);
const progressed = replace(partial, [pick("Finger 2", 16058)]);
const nearReference = replace(fresh, slots.map((slot) => slot === "Finger 1" ? pick(slot, 12543) : slot === "Finger 2" ? pick(slot, 16058) : pick(slot)));
const browserBaseline = replace(nearReference, [starter("Back"), starter("Finger 2")]);
const browserProgressed = replace(browserBaseline, [pick("Finger 2", 16058)]);

export const eraFrostMageFixtures = {
  fresh60: character("Fresh Frost", fresh),
  partial: character("Partial Frost", partial),
  progressed: character("Progressed Frost", progressed),
  nearReference: character("Near Frost Reference", nearReference),
  browserBaseline: character("Browser Frost Baseline", browserBaseline),
  browserProgressed: character("Browser Frost Progressed", browserProgressed),
};
