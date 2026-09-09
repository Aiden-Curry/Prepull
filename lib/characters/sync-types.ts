import type { CharacterRealmType, CharacterTalent, ContentVersion, EquippedItem, Faction } from "../types.ts";

export type CharacterSyncStatus = "success" | "failed";
export type CharacterSync = {
  id: string;
  userCharacterId: string;
  syncedAt: string;
  status: CharacterSyncStatus;
  level?: number;
  className?: string;
  spec?: string;
  race?: string;
  faction?: Faction;
  professions: string[];
  talents: CharacterTalent[];
  contentVersion: ContentVersion;
  characterRealmType: CharacterRealmType;
  provider: string;
  errorCode?: string;
  errorMessage?: string;
  equipment: EquippedItem[];
};
