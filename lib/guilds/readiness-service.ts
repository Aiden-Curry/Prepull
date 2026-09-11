import { normalizeLookup } from "../characters/normalization.ts";
import { buildPlayerAdvice } from "../player-advice/service.ts";
import type { EquippedItem, NormalizedCharacter } from "../types.ts";
import { query } from "./db.ts";
import { GuildDomainError } from "./errors.ts";
import { canManageRaid } from "./permissions.ts";
import { guildReadinessRepository, type RaidReadinessRow, type ReadinessIdentityRow } from "./readiness-repository.ts";
import type { EligibleReadinessShare, GuildCharacterReadiness, RaidReadiness, RaidReadinessSummary, ReadinessActivityCategory } from "./readiness-types.ts";
import type { GuildMembership } from "./types.ts";

const iso = (value: any) => value?.toISOString?.() ?? String(value);

export function identitiesMatch(row: Pick<ReadinessIdentityRow, "member_region" | "member_realm" | "character_name" | "member_realm_type" | "member_content_version" | "character_region" | "realm_slug" | "normalized_character_name" | "character_realm_type" | "character_content_version">) {
  return row.member_region === row.character_region
    && normalizeLookup(row.member_realm) === normalizeLookup(row.realm_slug)
    && normalizeLookup(row.character_name) === normalizeLookup(row.normalized_character_name)
    && row.member_realm_type === row.character_realm_type
    && row.member_content_version === row.character_content_version;
}

export async function listEligibleReadinessShares(userId: string, guildId?: string): Promise<EligibleReadinessShare[]> {
  const rows = await guildReadinessRepository.listEligibleCandidates(userId, guildId);
  return rows.filter(identitiesMatch).map((row) => ({
    guildId: row.guild_id,
    guildName: row.guild_name,
    guildCharacterId: row.guild_member_id,
    characterName: row.character_name,
    userCharacterId: row.user_character_id,
    enabled: Boolean(row.share_enabled),
    shareId: row.share_id,
  }));
}

export function enableReadinessShare(userId: string, guildId: string, guildCharacterId: string, userCharacterId: string) {
  return guildReadinessRepository.enable(userId, guildId, guildCharacterId, userCharacterId, identitiesMatch);
}

export function disableReadinessShare(userId: string, shareId: string) {
  return guildReadinessRepository.disable(userId, shareId);
}

const membershipFrom = (row: any, userId: string): GuildMembership => ({
  id: row.id, guildId: row.guild_id, userId, role: row.role,
  capabilities: row.capabilities ?? [], revokedCapabilities: row.revoked_capabilities ?? [], active: row.active,
  createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
});

function itemFrom(row: Record<string, any>): EquippedItem {
  return {
    itemId: row.item_id ?? 0, name: row.item_name, slot: row.slot, itemLevel: row.item_level ?? undefined,
    quality: row.quality, icon: row.icon, stats: row.stats ?? {}, enchantments: row.enchantments ?? [],
    weapon: row.weapon ?? undefined, setId: row.set_id ?? undefined, specialEffectId: row.special_effect_id ?? undefined,
    uniqueGroup: row.unique_group ?? undefined, source: row.source ?? undefined, missing: row.item_id == null,
  };
}

function validShare(row: RaidReadinessRow) {
  return Boolean(row.share_id && row.share_enabled && row.share_membership_active && row.claim_status === "approved"
    && row.member_active && !row.archived_at && identitiesMatch({
      member_region: row.member_region, member_realm: row.member_realm, character_name: row.character_name,
      member_realm_type: row.member_realm_type, member_content_version: row.member_content_version,
      character_region: row.character_region, realm_slug: row.realm_slug,
      normalized_character_name: row.normalized_character_name, character_realm_type: row.character_realm_type,
      character_content_version: row.character_content_version,
    }));
}

export function projectGuildCharacterReadiness(row: RaidReadinessRow, equipment: EquippedItem[] = []): GuildCharacterReadiness {
  const base = {
    guildCharacterId: row.guild_member_id,
    characterName: row.character_name,
    className: row.roster_class_name || "Unknown class",
    specName: row.roster_spec || "Unknown specialization",
    rosterRole: row.roster_role || "",
    groupName: row.group_name || undefined,
    raidRole: row.role_name || undefined,
    mainName: row.main_name || undefined,
  };
  if (!row.member_active) return { ...base, shareState: "unavailable", dataState: "unavailable", message: "Roster character is inactive." };
  if (!validShare(row)) return { ...base, shareState: "not-shared", dataState: "unavailable", message: "No readiness shared for this character." };
  if (!row.sync_id) return { ...base, shareState: "shared", dataState: "needs-refresh", message: "Needs a character refresh before gear-readiness details are available." };
  const character: NormalizedCharacter = {
    id: row.user_character_id, name: row.saved_character_name, region: row.character_region, realm: row.realm_name,
    contentVersion: row.sync_content_version, realmType: row.sync_realm_type, level: row.level ?? 0,
    race: row.sync_race ?? "Unavailable", class: row.sync_class_name ?? "Unavailable", spec: row.sync_spec ?? "Unavailable",
    faction: row.sync_faction ?? "Alliance", professions: row.professions ?? [], talents: row.talents ?? [], equipment,
    dataMeta: { provider: row.provider === "blizzard" ? "blizzard" : "mock", isLive: row.provider === "blizzard", lastUpdated: iso(row.synced_at) },
  };
  const { advice } = buildPlayerAdvice(character);
  if (!advice.supported) return {
    ...base, className: character.class, specName: character.spec, shareState: "shared", dataState: "unsupported-spec",
    lastRefreshedAt: iso(row.synced_at), recommendationSupport: { supported: false },
    message: "Readiness shared. Personal gear recommendations for this specialization aren't available yet.",
  };
  const categories: Partial<Record<ReadinessActivityCategory, number>> = {};
  for (const action of [...advice.topActions, ...advice.secondaryActions]) categories[action.type] = (categories[action.type] ?? 0) + action.upgradeCount;
  const remaining = advice.summary.actionableUpgradeCount;
  return {
    ...base, className: character.class, specName: character.spec, shareState: "shared", dataState: "available",
    lastRefreshedAt: iso(row.synced_at), recommendationSupport: { supported: true, specKey: advice.specKey, supportedPhases: advice.availablePhases },
    summary: { ...advice.summary }, activityCategoryCounts: categories,
    message: remaining === 0 ? "No strong Pre-Raid opportunities remain." : `${remaining} realistic Pre-Raid opportunit${remaining === 1 ? "y" : "ies"} remain.`,
  };
}

export function summarizeReadiness(selected: GuildCharacterReadiness[]): RaidReadinessSummary {
  return {
    selectedCount: selected.length,
    sharingCount: selected.filter((row) => row.shareState === "shared").length,
    supportedCount: selected.filter((row) => row.dataState === "available").length,
    needsRefreshCount: selected.filter((row) => row.dataState === "needs-refresh").length,
    unsupportedCount: selected.filter((row) => row.dataState === "unsupported-spec").length,
    notSharingCount: selected.filter((row) => row.shareState !== "shared").length,
  };
}

export async function getRaidReadiness(viewerUserId: string, guildId: string, raidId: string): Promise<RaidReadiness> {
  const access = await query<Record<string, any>>(`
    SELECT membership.*,raid.raid_leader_user_id
    FROM raid_events raid
    JOIN guild_workspace_memberships membership ON membership.guild_id=raid.guild_id AND membership.user_id=$1 AND membership.active=true
    WHERE raid.id=$2 AND raid.guild_id=$3`, [viewerUserId, raidId, guildId]);
  const accessRow = access.rows[0];
  if (!accessRow || !canManageRaid(membershipFrom(accessRow, viewerUserId), accessRow.raid_leader_user_id, viewerUserId)) {
    throw new GuildDomainError("NOT_FOUND", "Raid readiness was not found.");
  }
  const rows = await guildReadinessRepository.loadRaidRows(guildId, raidId);
  if (!rows.length) {
    const raid = await query<Record<string, any>>(`SELECT raid.id AS raid_id,raid.name AS raid_name,raid.instance,raid.starts_at,g.id AS guild_id,g.name AS guild_name,g.content_version AS guild_content_version FROM raid_events raid JOIN guilds g ON g.id=raid.guild_id AND g.archived_at IS NULL WHERE raid.id=$1 AND g.id=$2`, [raidId, guildId]);
    if (!raid.rows[0]) throw new GuildDomainError("NOT_FOUND", "Raid readiness was not found.");
    rows.push(raid.rows[0]);
  }
  const validSyncIds = rows.filter(validShare).map((row) => row.sync_id).filter(Boolean);
  const itemRows = await guildReadinessRepository.loadSyncItems([...new Set(validSyncIds)]);
  const items = new Map<string, EquippedItem[]>();
  for (const item of itemRows) items.set(item.sync_id, [...(items.get(item.sync_id) ?? []), itemFrom(item)]);
  const projected = rows.filter((row) => row.guild_member_id).map((row) => ({ state: row.roster_state, readiness: projectGuildCharacterReadiness(row, items.get(row.sync_id) ?? []) }));
  const selected = projected.filter((row) => row.state === "selected").map((row) => row.readiness);
  const bench = projected.filter((row) => row.state === "bench").map((row) => row.readiness);
  const first = rows[0];
  return {
    guild: { id: first.guild_id, name: first.guild_name, contentVersion: first.guild_content_version },
    raid: { id: first.raid_id, name: first.raid_name, instance: first.instance, startsAt: iso(first.starts_at) },
    selected, bench, summary: summarizeReadiness(selected),
  };
}

export async function getGuildCharacterReadiness(viewerUserId: string, guildId: string, raidId: string, guildCharacterId: string) {
  const readiness = await getRaidReadiness(viewerUserId, guildId, raidId);
  const row = [...readiness.selected, ...readiness.bench].find((entry) => entry.guildCharacterId === guildCharacterId);
  if (!row) throw new GuildDomainError("NOT_FOUND", "Character readiness was not found.");
  return row;
}
