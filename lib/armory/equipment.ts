import type { EquippedItem, EquipmentSlot, ItemQuality } from "../types.ts";
import { isTrustedArmoryIcon } from "./wowhead.ts";
export type BlizzardEquipmentEntry = { slot?: { name?: string; type?: string }; item?: { id?: number }; name?: string; quality?: { type?: string }; level?: { value?: number }; media?: { assets?: { key?: string; value?: string }[] }; stats?: Array<{ type?: { name?: string }; value?: number }>; enchantments?: Array<{ display_string?: string; enchantment_id?: number; enchantment_slot?: { type?: string } }>; sockets?: { item?: { id?: number } }[] };
const slotMap: Record<string, EquipmentSlot> = { HEAD: "Head", NECK: "Neck", SHOULDER: "Shoulder", BACK: "Back", CHEST: "Chest", SHIRT: "Shirt", TABARD: "Tabard", WRIST: "Wrist", HANDS: "Hands", WAIST: "Waist", LEGS: "Legs", FEET: "Feet", FINGER_1: "Finger 1", FINGER_2: "Finger 2", TRINKET_1: "Trinket 1", TRINKET_2: "Trinket 2", MAIN_HAND: "Main Hand", OFF_HAND: "Off Hand / Shield", SHIELD: "Off Hand / Shield", RANGED: "Ranged / Relic", RELIC: "Ranged / Relic" };
const qualities: Record<string, ItemQuality> = { POOR: "Poor", COMMON: "Common", UNCOMMON: "Uncommon", RARE: "Rare", EPIC: "Epic", LEGENDARY: "Legendary" };
export function normalizeEquipment(payload: { equipped_items?: BlizzardEquipmentEntry[] }): EquippedItem[] {
  const items: EquippedItem[] = []; const seen = new Set<EquipmentSlot>();
  for (const entry of (payload.equipped_items ?? []).slice(0, 30)) {
    const slot = slotMap[(entry.slot?.type ?? "").toUpperCase()]; const itemId = entry.item?.id;
    if (!slot || !Number.isSafeInteger(itemId) || !itemId || itemId <= 0 || seen.has(slot)) continue;
    seen.add(slot);
    const icon = entry.media?.assets?.find((asset) => asset.key === "icon" && isTrustedArmoryIcon(asset.value))?.value;
    items.push({ itemId, name: entry.name ?? `Item ${itemId}`, slot, quality: qualities[entry.quality?.type ?? ""] ?? "Unknown", icon: icon ?? "", itemLevel: entry.level?.value,
      stats: Object.fromEntries((entry.stats ?? []).filter((stat) => stat.type?.name && typeof stat.value === "number").map((stat) => [stat.type!.name!, String(stat.value)])),
      enchantments: entry.enchantments?.flatMap((enchantment) => enchantment.display_string ? [enchantment.display_string] : []),
      enchantIds: entry.enchantments?.filter((enchantment) => !enchantment.enchantment_slot?.type || enchantment.enchantment_slot.type === "PERMANENT").flatMap((enchantment) => Number.isSafeInteger(enchantment.enchantment_id) && enchantment.enchantment_id! > 0 ? [enchantment.enchantment_id!] : []),
      gemIds: entry.sockets?.flatMap((socket) => Number.isSafeInteger(socket.item?.id) && socket.item!.id! > 0 ? [socket.item!.id!] : []),
    });
  }
  return items;
}
