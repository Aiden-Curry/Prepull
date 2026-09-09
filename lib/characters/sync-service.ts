import type { EquippedItem, NormalizedCharacter } from "../types.ts";
import type { CharacterSync } from "./sync-types.ts";

export type GearChange = { slot: string; kind: "added" | "replaced" | "removed" | "unchanged"; current?: EquippedItem; previous?: EquippedItem };
export type GearChangeSummary = { changes: GearChange[]; changedCount: number; upgrades: number; completedTargets: string[]; firstSync: boolean };
const bySlot = (items: EquippedItem[]) => new Map(items.map((item) => [item.slot, item]));
export function diffEquipment(previous: CharacterSync | undefined, current: CharacterSync): GearChangeSummary {
  if (!previous) return { changes: [], changedCount: 0, upgrades: 0, completedTargets: [], firstSync: true };
  const left = bySlot(previous.equipment); const right = bySlot(current.equipment); const slots = new Set([...left.keys(), ...right.keys()]); const changes: GearChange[] = [];
  for (const slot of slots) { const before = left.get(slot); const after = right.get(slot); if (!before && after) changes.push({ slot, kind: "added", current: after }); else if (before && !after) changes.push({ slot, kind: "removed", previous: before }); else if (before && after && before.itemId !== after.itemId) changes.push({ slot, kind: "replaced", previous: before, current: after }); else changes.push({ slot, kind: "unchanged", previous: before, current: after }); }
  return { changes, changedCount: changes.filter((change) => change.kind !== "unchanged").length, upgrades: changes.filter((change) => change.kind === "added" || change.kind === "replaced").length, completedTargets: [], firstSync: false };
}
export function completedTargetNames(previous: NormalizedCharacter | undefined, current: NormalizedCharacter, targetIds: Set<number>) { if (!previous) return []; const before = new Set(previous.equipment.map((item) => item.itemId)); return current.equipment.filter((item) => targetIds.has(item.itemId) && !before.has(item.itemId)).map((item) => item.name); }
