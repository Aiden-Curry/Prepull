import type { CharacterRealmType, ContentVersion, Faction, Region } from "../types.ts";

export type SavedCharacter = {
  id: string;
  userId: string;
  region: Region;
  realmSlug: string;
  realmName: string;
  characterName: string;
  normalizedCharacterName: string;
  characterRealmType: CharacterRealmType;
  contentVersion: ContentVersion;
  className: string;
  level: number;
  race: string;
  faction: Faction;
  lastSyncedAt?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type SaveCharacterInput = Omit<SavedCharacter, "id" | "userId" | "isPrimary" | "createdAt" | "updatedAt" | "archivedAt"> & { lastSyncedAt?: string };
