import type { ContentVersion } from "../types.ts";
import type { SupportedSpecKey } from "../recommendations/registry.ts";

export type ReadinessActivityCategory = "dungeon" | "raid" | "quest" | "crafting" | "vendor" | "pvp" | "other";

export type GuildCharacterReadiness = {
  guildCharacterId: string;
  characterName: string;
  className: string;
  specName: string;
  rosterRole: string;
  groupName?: string;
  raidRole?: string;
  mainName?: string;
  shareState: "shared" | "not-shared" | "unavailable";
  dataState: "available" | "needs-refresh" | "unsupported-spec" | "unavailable";
  lastRefreshedAt?: string;
  recommendationSupport?: { supported: boolean; specKey?: SupportedSpecKey; supportedPhases?: number[] };
  summary?: { evaluatedSlots: number; actionableUpgradeCount: number; highPriorityCount: number };
  activityCategoryCounts?: Partial<Record<ReadinessActivityCategory, number>>;
  message: string;
};

export type RaidReadinessSummary = {
  selectedCount: number;
  sharingCount: number;
  supportedCount: number;
  needsRefreshCount: number;
  unsupportedCount: number;
  notSharingCount: number;
};

export type RaidReadiness = {
  guild: { id: string; name: string; contentVersion: ContentVersion };
  raid: { id: string; name: string; instance: string; startsAt: string };
  selected: GuildCharacterReadiness[];
  bench: GuildCharacterReadiness[];
  summary: RaidReadinessSummary;
};

export type EligibleReadinessShare = {
  guildId: string;
  guildName: string;
  guildCharacterId: string;
  characterName: string;
  userCharacterId: string;
  enabled: boolean;
  shareId?: string;
};
