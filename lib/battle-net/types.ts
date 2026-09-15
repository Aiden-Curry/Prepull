import type { ContentVersion, Region } from "../types.ts";

export type BattleNetIntent = "login" | "link";
export type BattleNetDiscoveryStatus = "complete" | "era_unavailable";
export type BattleNetContentSupport = "supported" | "unsupported" | "unavailable";
export type BattleNetImportStatus = "pending" | "importing" | "imported" | "already_added" | "failed" | "unsupported";

export type BattleNetIdentity = {
  subject: string;
  accountId?: string;
  battleTag: string;
};

export type BattleNetDiscoveredCharacter = {
  providerCharacterId?: string;
  name: string;
  normalizedName: string;
  realmName: string;
  realmSlug: string;
  region: Region;
  realmType: "era" | "anniversary" | "unknown";
  contentSupport: BattleNetContentSupport;
  className?: string;
  race?: string;
  level?: number;
};

export type BattleNetOAuthState = {
  stateHash: string;
  browserBindingHash: string;
  region: Region;
  intent: BattleNetIntent;
  initiatingUserId?: string;
  contentVersion: ContentVersion;
  callbackUrl: string;
  expiresAt: Date;
};

export type BattleNetImportCharacter = BattleNetDiscoveredCharacter & {
  id: string;
  importStatus: BattleNetImportStatus;
  failureCode?: string;
  attemptCount: number;
  savedCharacterId?: string;
};

export type BattleNetImportSession = {
  id: string;
  userId: string;
  connectionId: string;
  contentVersion: ContentVersion;
  callbackUrl: string;
  discoveryStatus: BattleNetDiscoveryStatus;
  expiresAt: string;
  completedAt?: string;
  characters: BattleNetImportCharacter[];
};
