import type { CharacterRealmType, ContentVersion, Region } from "../types.ts";

export type UnavailableSection = { status: "unavailable"; reason: "not-provided" | "unsupported" | "not-synced" } | { status: "temporary-error" };
export type Statistic = { key: string; label: string; value: number; unit?: "%" };
export type CharacterStatistics = UnavailableSection | { status: "available"; source: "blizzard" | "mock"; retrievedAt: string; values: Statistic[] };
export type TalentSelection = { name: string; rank: number; spellId?: number };
export type CharacterTalentState = UnavailableSection | { status: "available"; source: "blizzard" | "mock"; retrievedAt: string; trees: { name: string; points: number; selections: TalentSelection[] }[] };
export type ArmorySnapshot = { statistics: CharacterStatistics; talents: CharacterTalentState };
export const ARMORY_SLOTS = [
  ["head", "Head"], ["neck", "Neck"], ["shoulder", "Shoulder"], ["back", "Back"],
  ["chest", "Chest"], ["wrist", "Wrist"], ["hands", "Hands"], ["waist", "Waist"],
  ["legs", "Legs"], ["feet", "Feet"], ["finger1", "Finger 1"], ["finger2", "Finger 2"],
  ["trinket1", "Trinket 1"], ["trinket2", "Trinket 2"], ["shirt", "Shirt"], ["tabard", "Tabard"],
  ["mainHand", "Main Hand"], ["offHand", "Off Hand / Shield"], ["ranged", "Ranged / Relic"],
] as const;
export type ArmorySlot = typeof ARMORY_SLOTS[number][0];
export type ArmoryItem = { itemId: number; name: string; quality?: string; itemLevel?: number; iconUrl?: string; enchantments: string[]; enchantIds: number[]; gemIds: number[] };
export type CharacterArmory = ArmorySnapshot & {
  character: { name: string; realm: string; region: Region; realmType: CharacterRealmType; contentVersion: ContentVersion; level: number; race: string; className: string; specialization: string; faction: string };
  equipment: { slot: ArmorySlot; label: string; item?: ArmoryItem }[];
  equipmentStatus: "available" | "unavailable";
  retrievedAt: string;
  source: "blizzard" | "mock";
};
