import type { CharacterRealmType, ContentVersion, Faction, Region } from "../types.ts";

export type GuildRole = "owner" | "officer" | "member";
export type SignupStatus = "pending" | "confirmed" | "declined" | "waitlist";
export type RaidSignup = { characterId: string; status: SignupStatus; note?: string; updatedAt: string };
export type GuildMember = { id: string; characterId: string; characterName: string; className: string; spec: string; level: number; race: string; faction: Faction; realm: string; region: Region; realmType: CharacterRealmType; contentVersion: ContentVersion; role: string; readiness: "ready" | "needs-review" | "unknown"; gearSetId?: string; joinedAt: string };
export type RaidGroup = { id: string; name: string; memberCharacterIds: string[] };
export type RaidAssignment = { id: string; characterId: string; label: string; detail?: string };
export type RaidEvent = { id: string; guildId: string; name: string; instance: string; startsAt: string; durationMinutes: number; status: "draft" | "open" | "locked" | "complete"; signups: RaidSignup[]; selectedCharacterIds: string[]; groups: RaidGroup[]; assignments: RaidAssignment[]; createdAt: string; updatedAt: string };
export type Guild = { id: string; name: string; region: Region; realmSlug: string; realmName: string; characterRealmType: CharacterRealmType; contentVersion: ContentVersion; faction: Faction; description: string; ownerUserId: string; importProvider: "manual" | "blizzard" | "json"; externalGuildId?: string; lastRosterSyncAt?: string; createdAt: string; updatedAt: string; memberIds: string[]; raidEventIds: string[] };
export type GuildWorkspace = { guild: Guild; roster: GuildMember[]; events: RaidEvent[] };
export type CreateGuildInput = Pick<Guild, "name" | "region" | "realmSlug" | "realmName" | "characterRealmType" | "contentVersion" | "faction" | "description">;
export type CreateRaidInput = Pick<RaidEvent, "name" | "instance" | "startsAt" | "durationMinutes">;
