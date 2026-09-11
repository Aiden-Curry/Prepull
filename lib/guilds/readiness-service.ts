import { normalizeLookup } from "../characters/normalization.ts";
import { buildPlayerAdvice } from "../player-advice/service.ts";
import type { PlayerAction, PlayerAdvice } from "../player-advice/types.ts";
import type { EquippedItem, NormalizedCharacter } from "../types.ts";
import type { RaidPrepActivityCategory, RaidPrepActivityGroup, RaidPrepBoard } from "./prep-board-types.ts";
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

function normalizedCharacter(row: RaidReadinessRow, equipment: EquippedItem[]): NormalizedCharacter {
  return {
    id: row.user_character_id, name: row.saved_character_name, region: row.character_region, realm: row.realm_name,
    contentVersion: row.sync_content_version, realmType: row.sync_realm_type, level: row.level ?? 0,
    race: row.sync_race ?? "Unavailable", class: row.sync_class_name ?? "Unavailable", spec: row.sync_spec ?? "Unavailable",
    faction: row.sync_faction ?? "Alliance", professions: row.professions ?? [], talents: row.talents ?? [], equipment,
    dataMeta: { provider: row.provider === "blizzard" ? "blizzard" : "mock", isLive: row.provider === "blizzard", lastUpdated: iso(row.synced_at) },
  };
}

export type RaidPrepSource = { rosterState: "selected" | "bench"; readiness: GuildCharacterReadiness; advice?: PlayerAdvice };

export function projectRaidPrepSource(row: RaidReadinessRow, equipment: EquippedItem[] = []): RaidPrepSource {
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
  const rosterState = row.roster_state === "bench" ? "bench" : "selected";
  if (!row.member_active) return { rosterState, readiness: { ...base, shareState: "unavailable", dataState: "unavailable", message: "Roster character is inactive." } };
  if (!validShare(row)) return { rosterState, readiness: { ...base, shareState: "not-shared", dataState: "unavailable", message: "No readiness shared for this character." } };
  if (!row.sync_id) return { rosterState, readiness: { ...base, shareState: "shared", dataState: "needs-refresh", message: "Needs a character refresh before gear-readiness details are available." } };
  const character = normalizedCharacter(row, equipment);
  const { advice } = buildPlayerAdvice(character);
  if (!advice.supported) return { rosterState, advice, readiness: {
      ...base, className: character.class, specName: character.spec, shareState: "shared", dataState: "unsupported-spec",
      lastRefreshedAt: iso(row.synced_at), recommendationSupport: { supported: false },
      message: "Readiness shared. Personal gear recommendations for this specialization aren't available yet.",
    } };
  const categories: Partial<Record<ReadinessActivityCategory, number>> = {};
  for (const action of [...advice.topActions, ...advice.secondaryActions]) categories[action.type] = (categories[action.type] ?? 0) + action.upgradeCount;
  const remaining = advice.summary.actionableUpgradeCount;
  return { rosterState, advice, readiness: {
      ...base, className: character.class, specName: character.spec, shareState: "shared", dataState: "available",
      lastRefreshedAt: iso(row.synced_at), recommendationSupport: { supported: true, specKey: advice.specKey, supportedPhases: advice.availablePhases },
      summary: { ...advice.summary }, activityCategoryCounts: categories,
      message: remaining === 0 ? "No strong Pre-Raid opportunities remain." : `${remaining} realistic Pre-Raid opportunit${remaining === 1 ? "y" : "ies"} remain.`,
    } };
}

export function projectGuildCharacterReadiness(row: RaidReadinessRow, equipment: EquippedItem[] = []): GuildCharacterReadiness {
  return projectRaidPrepSource(row, equipment).readiness;
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

function prepCategory(action: PlayerAction): RaidPrepActivityCategory {
  if (action.view === "raid") return "raid-alternative";
  if (action.targets.some((target) => target.realistic && target.sourceType === "Reputation")) return "reputation";
  if (action.type === "dungeon") return "dungeon";
  if (action.type === "quest") return "quest";
  if (action.type === "crafting") return "crafted";
  return "other";
}

function sortedGroups(groups: Map<string, RaidPrepActivityGroup>) {
  return [...groups.values()].map((group) => ({
    ...group,
    playerCount: group.players.length,
    players: [...group.players].sort((a, b) => a.characterName.localeCompare(b.characterName) || a.guildCharacterId.localeCompare(b.guildCharacterId)),
  })).sort((a, b) => b.playerCount - a.playerCount || b.opportunityCount - a.opportunityCount || a.label.localeCompare(b.label) || a.key.localeCompare(b.key));
}

export function buildRaidPrepBoard(
  guild: RaidPrepBoard["guild"],
  raid: RaidPrepBoard["raid"],
  sources: RaidPrepSource[],
): RaidPrepBoard {
  const selected = sources.filter((source) => source.rosterState === "selected");
  const groups = new Map<string, RaidPrepActivityGroup>();
  const realisticPlayers = new Set<string>();
  for (const source of selected) {
    if (source.readiness.dataState !== "available" || !source.advice?.supported) continue;
    for (const action of [...source.advice.topActions, ...source.advice.secondaryActions]) {
      if (action.upgradeCount < 1) continue;
      const category = prepCategory(action);
      const key = `${category}:${action.id}`;
      const group = groups.get(key) ?? { key, label: action.activity, category, playerCount: 0, opportunityCount: 0, players: [] };
      let player = group.players.find((candidate) => candidate.guildCharacterId === source.readiness.guildCharacterId);
      if (!player) {
        player = {
          guildCharacterId: source.readiness.guildCharacterId,
          characterName: source.readiness.characterName,
          className: source.readiness.className,
          specName: source.readiness.specName,
          groupName: source.readiness.groupName,
          raidRole: source.readiness.raidRole,
          opportunityCount: 0,
          lastRefreshedAt: source.readiness.lastRefreshedAt,
        };
        group.players.push(player);
      }
      player.opportunityCount += action.upgradeCount;
      group.opportunityCount += action.upgradeCount;
      groups.set(key, group);
      if (category !== "raid-alternative") realisticPlayers.add(source.readiness.guildCharacterId);
    }
  }
  const activityGroups = sortedGroups(new Map([...groups].filter(([, group]) => group.category !== "raid-alternative")));
  const raidAlternativeGroups = sortedGroups(new Map([...groups].filter(([, group]) => group.category === "raid-alternative")));
  const available = selected.filter((source) => source.readiness.dataState === "available");
  return {
    guild,
    raid,
    summary: {
      selectedCount: selected.length,
      sharingCount: selected.filter((source) => source.readiness.shareState === "shared").length,
      supportedDataCount: available.length,
      withRealisticOpportunitiesCount: realisticPlayers.size,
      needsRefreshCount: selected.filter((source) => source.readiness.dataState === "needs-refresh").length,
      unsupportedSpecCount: selected.filter((source) => source.readiness.dataState === "unsupported-spec").length,
      notSharingCount: selected.filter((source) => source.readiness.shareState !== "shared").length,
      noStrongPreRaidOpportunitiesCount: available.filter((source) => !realisticPlayers.has(source.readiness.guildCharacterId)).length,
    },
    activityGroups,
    raidAlternativeGroups,
    benchCount: sources.filter((source) => source.rosterState === "bench").length,
  };
}

async function loadAuthorizedRaidData(viewerUserId: string, guildId: string, raidId: string) {
  // Fixed query shape: one authorization query, one batched roster/share/latest-success query,
  // and one batched sync-item query. An empty roster needs one metadata fallback query.
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
  return { rows, items, first: rows[0] };
}

export async function getRaidReadiness(viewerUserId: string, guildId: string, raidId: string): Promise<RaidReadiness> {
  const { rows, items, first } = await loadAuthorizedRaidData(viewerUserId, guildId, raidId);
  const projected = rows.filter((row) => row.guild_member_id).map((row) => projectRaidPrepSource(row, items.get(row.sync_id) ?? []));
  const selected = projected.filter((source) => source.rosterState === "selected").map((source) => source.readiness);
  const bench = projected.filter((source) => source.rosterState === "bench").map((source) => source.readiness);
  return {
    guild: { id: first.guild_id, name: first.guild_name, contentVersion: first.guild_content_version },
    raid: { id: first.raid_id, name: first.raid_name, instance: first.instance, startsAt: iso(first.starts_at) },
    selected, bench, summary: summarizeReadiness(selected),
  };
}

export async function getRaidPrepBoard(viewerUserId: string, guildId: string, raidId: string): Promise<RaidPrepBoard> {
  const { rows, items, first } = await loadAuthorizedRaidData(viewerUserId, guildId, raidId);
  const sources = rows.filter((row) => row.guild_member_id).map((row) => projectRaidPrepSource(row, items.get(row.sync_id) ?? []));
  return buildRaidPrepBoard(
    { id: first.guild_id, name: first.guild_name },
    { id: first.raid_id, name: first.raid_name, instance: first.instance, startsAt: iso(first.starts_at) },
    sources,
  );
}

export async function getGuildCharacterReadiness(viewerUserId: string, guildId: string, raidId: string, guildCharacterId: string) {
  const readiness = await getRaidReadiness(viewerUserId, guildId, raidId);
  const row = [...readiness.selected, ...readiness.bench].find((entry) => entry.guildCharacterId === guildCharacterId);
  if (!row) throw new GuildDomainError("NOT_FOUND", "Character readiness was not found.");
  return row;
}
