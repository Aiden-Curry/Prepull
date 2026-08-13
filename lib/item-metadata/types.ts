import type { ContentVersion, EquippedItem, CharacterRealmType } from "../types.ts";

export type ItemMetadataProvenance = { source: "manual-dataset" | "blizzard-api" | "cache"; verifiedAt: string; contentVersion: ContentVersion; realmType: CharacterRealmType };
export type NormalizedItemMetadata = EquippedItem & { provenance: ItemMetadataProvenance; inventoryType?: string; classRestrictions?: string[]; uniqueType?: "Unique" | "Unique-Equipped"; mediaUrl?: string };
