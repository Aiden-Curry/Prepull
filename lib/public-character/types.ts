import type { CharacterRealmType, ContentVersion, Faction, Region } from "../types.ts";

export type PublicCharacterProjection = {
  name: string;
  realm: string;
  region: Region;
  level: number;
  race: string;
  className: string;
  specialization: string;
  faction: Faction;
  contentVersion: ContentVersion;
  realmType: CharacterRealmType;
  providerStatus: "live" | "preview";
  retrievedAt: string;
};

export type PublicCacheEntry =
  | { status: "found"; projection: PublicCharacterProjection }
  | { status: "not_found"; projection: null };

export interface PublicCharacterCacheStore {
  get(key: string, now: Date): Promise<PublicCacheEntry | undefined>;
  set(key: string, entry: PublicCacheEntry, expiresAt: Date, now: Date): Promise<void>;
}
