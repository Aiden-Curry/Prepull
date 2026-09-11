export type RaidPrepActivityCategory = "dungeon" | "quest" | "crafted" | "reputation" | "raid-alternative" | "other";

export type RaidPrepPlayerSummary = {
  guildCharacterId: string;
  characterName: string;
  className: string;
  specName: string;
  groupName?: string;
  raidRole?: string;
  opportunityCount: number;
  lastRefreshedAt?: string;
};

export type RaidPrepActivityGroup = {
  key: string;
  label: string;
  category: RaidPrepActivityCategory;
  playerCount: number;
  opportunityCount: number;
  players: RaidPrepPlayerSummary[];
};

export type RaidPrepSummary = {
  selectedCount: number;
  sharingCount: number;
  supportedDataCount: number;
  withRealisticOpportunitiesCount: number;
  needsRefreshCount: number;
  unsupportedSpecCount: number;
  notSharingCount: number;
  noStrongPreRaidOpportunitiesCount: number;
};

export type RaidPrepBoard = {
  guild: { id: string; name: string };
  raid: { id: string; name: string; instance: string; startsAt: string };
  summary: RaidPrepSummary;
  activityGroups: RaidPrepActivityGroup[];
  raidAlternativeGroups: RaidPrepActivityGroup[];
  benchCount: number;
};
