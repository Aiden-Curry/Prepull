import type { NormalizedCharacter } from "../types.ts";
// Deliberately synthetic presentation data. It is never used by the live provider.
export function withMockArmory(character: NormalizedCharacter): NormalizedCharacter {
  const retrievedAt = "2026-09-16T12:00:00.000Z";
  return { ...character, equipment: character.equipment.map((item) => ({ ...item, icon: "/images/armory/fixture-item.svg" })), armory: {
    statistics: { status: "available", source: "mock", retrievedAt, values: [{ key: "health", label: "Health", value: 4200 }, { key: "stamina", label: "Stamina", value: 200 }, { key: "armor", label: "Armor", value: 3500 }] },
    talents: { status: "unavailable", reason: "not-provided" },
  } };
}
