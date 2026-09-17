import metadata from "../../data/items/metadata.json" with { type: "json" };
import type { CharacterRealmType, EquippedItem } from "../types.ts";
import { isTrustedArmoryIcon } from "./wowhead.ts";

// Reuse only previously verified API metadata. Never borrow recommendation stats/quality.
const verified = new Map(metadata.filter((item) => item.provenance.source === "blizzard-api")
  .map((item) => [`${item.provenance.realmType}:${item.itemId}`, item]));
export function withVerifiedItemMetadata(item: EquippedItem, realmType: CharacterRealmType): EquippedItem {
  const known = verified.get(`${realmType}:${item.itemId}`);
  if (!known) return item;
  return { ...item, itemLevel: item.itemLevel ?? known.itemLevel, icon: item.icon || (isTrustedArmoryIcon(known.icon) ? known.icon : "") };
}
