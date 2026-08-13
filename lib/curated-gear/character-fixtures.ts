import type { Faction, NormalizedCharacter } from "../types.ts";
import { getCanonicalCuratedProfile } from "./repository.ts";
import { normalizedItemMetadata } from "../item-metadata/store.ts";
import { isAvailableInPhase } from "./availability.ts";

const profile = getCanonicalCuratedProfile();
const set = profile.sets.find((entry) => entry.id === "era-fury-pre-raid")!;
const phaseOneSet = profile.sets.find((entry) => entry.id === "era-fury-phase-1")!;
const metadata = normalizedItemMetadata();
const slots = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"] as const;
const entryFor = (slot: typeof slots[number], race: string) => {
  const entries = (set.slots[slot] ?? []).filter((entry) => isAvailableInPhase(entry.itemId, 1));
  const daggerEntries = (phaseOneSet.slots[slot] ?? []).filter((entry) => isAvailableInPhase(entry.itemId, 1));
  if (race === "Dwarf" && slot === "Main Hand") return daggerEntries.find((entry) => entry.itemId === 18816) ?? entries[0];
  if (race === "Dwarf" && slot === "Off Hand / Shield") return daggerEntries.find((entry) => entry.itemId === 18805) ?? entries[0];
  if (race === "Dwarf" && slot === "Hands") return daggerEntries.find((entry) => entry.itemId === 18823) ?? entries[0];
  const preferred = slot === "Main Hand" ? race === "Human" ? [12940, 11684] : race === "Orc" ? [811, 11684] : [12940, 11684] : slot === "Off Hand / Shield" ? race === "Orc" ? [871, 12939] : [12939, 871] : entries.map((entry) => entry.itemId);
  return preferred.map((itemId) => entries.find((entry) => entry.itemId === itemId)).find(Boolean) ?? entries[0];
};
const build = (name: string, race: string, faction: Faction): NormalizedCharacter => {
  const equipment = slots.map((slot) => {
    const reference = entryFor(slot, race);
    if (!reference) throw new Error(`Published Pre-Raid fixture has no ${slot} entry.`);
    const item = metadata.get(reference.itemId);
    if (!item) throw new Error(`Missing metadata for published Pre-Raid fixture item #${reference.itemId}.`);
    return { ...item, slot, setId: reference.setId, uniqueGroup: reference.uniqueGroup, source: reference.source };
  });
  return { id: `fixture-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, name, region: "eu", realm: "Firemaw", contentVersion: "era", realmType: "era", level: 60, race, class: "Warrior", spec: "Fury", faction, professions: ["Mining", "Engineering"], equipment, curatedReferenceSetId: "era-fury-phase-1" };
};

export const publishedPreRaidCompleteFixtures = {
  orc: build("Published Pre-Raid Complete (Orc)", "Orc", "Horde"),
  human: build("Published Pre-Raid Complete (Human)", "Human", "Alliance"),
  other: build("Published Pre-Raid Complete (Dwarf)", "Dwarf", "Alliance"),
};
