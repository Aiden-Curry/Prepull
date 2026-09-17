import type { NormalizedCharacter } from "../types.ts";
import { isTrustedArmoryIcon } from "./wowhead.ts";
import { ARMORY_SLOTS, type CharacterArmory, type ArmorySnapshot } from "./types.ts";

export const unavailableSnapshot = (): ArmorySnapshot => ({ statistics: { status: "unavailable", reason: "not-synced" }, talents: { status: "unavailable", reason: "not-provided" } });
const ids = (values?: number[]) => (values ?? []).filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 8);
export function projectArmory(character: NormalizedCharacter, retrievedAt: string): CharacterArmory {
  const snapshot = character.armory ?? unavailableSnapshot();
  return {
    character: { name: character.name, realm: character.realm, region: character.region, realmType: character.realmType, contentVersion: character.contentVersion, level: character.level, race: character.race, className: character.class, specialization: character.spec, faction: character.faction },
    equipment: ARMORY_SLOTS.map(([slot, label]) => {
      const item = character.equipment.find((entry) => entry.slot === label && !entry.missing && entry.itemId > 0);
      return { slot, label, ...(item ? { item: { itemId: item.itemId, name: item.name, quality: item.quality === "Unknown" ? undefined : item.quality, itemLevel: item.itemLevel, iconUrl: isTrustedArmoryIcon(item.icon) ? item.icon : undefined, enchantments: (item.enchantments ?? []).slice(0, 8), enchantIds: ids(item.enchantIds), gemIds: ids(item.gemIds) } } : {}) };
    }),
    equipmentStatus: character.equipmentStatus ?? "available", retrievedAt, source: character.dataMeta?.isLive ? "blizzard" : "mock",
    // Reconstruct nested values; never spread provider payloads into the public cache.
    statistics: snapshot.statistics.status === "available" ? { status: "available", source: snapshot.statistics.source, retrievedAt: snapshot.statistics.retrievedAt, values: snapshot.statistics.values.map(({ key, label, value, unit }) => ({ key, label, value, unit })) } : snapshot.statistics.status === "temporary-error" ? { status: "temporary-error" } : { status: "unavailable", reason: snapshot.statistics.reason },
    talents: snapshot.talents.status === "available" ? { status: "available", source: snapshot.talents.source, retrievedAt: snapshot.talents.retrievedAt, trees: snapshot.talents.trees.map(({ name, points, selections }) => ({ name, points, selections: selections.map(({ name, rank, spellId }) => ({ name, rank, spellId })) })) } : snapshot.talents.status === "temporary-error" ? { status: "temporary-error" } : { status: "unavailable", reason: snapshot.talents.reason },
  };
}
