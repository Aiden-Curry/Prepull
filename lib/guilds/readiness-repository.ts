import type { PoolClient } from "pg";
import { query, withTransaction } from "./db.ts";
import { GuildDomainError } from "./errors.ts";

export type ReadinessIdentityRow = {
  guild_id: string; guild_name: string; guild_member_id: string; character_name: string;
  member_region: string; member_realm: string; member_realm_type: string; member_content_version: string;
  user_character_id: string; character_region: string; realm_slug: string; normalized_character_name: string;
  character_realm_type: string; character_content_version: string; share_id?: string; share_enabled?: boolean;
};

export type RaidReadinessRow = Record<string, any>;

export class GuildReadinessRepository {
  async listEligibleCandidates(userId: string, guildId?: string) {
    const result = await query<ReadinessIdentityRow>(`
      SELECT g.id AS guild_id,g.name AS guild_name,m.id AS guild_member_id,m.character_name,
        m.region AS member_region,m.realm AS member_realm,m.realm_type AS member_realm_type,
        m.content_version AS member_content_version,c.id AS user_character_id,c.region AS character_region,
        c.realm_slug,c.normalized_character_name,c.character_realm_type,
        c.content_version AS character_content_version,s.id AS share_id,s.enabled AS share_enabled
      FROM guild_workspace_memberships membership
      JOIN guilds g ON g.id=membership.guild_id AND g.archived_at IS NULL
      JOIN guild_member_links claim ON claim.user_id=membership.user_id AND claim.status='approved'
      JOIN guild_members m ON m.id=claim.guild_member_id AND m.guild_id=membership.guild_id AND m.active=true
      CROSS JOIN user_characters c
      LEFT JOIN guild_readiness_shares s ON s.guild_id=g.id AND s.guild_member_id=m.id AND s.user_character_id=c.id
      WHERE membership.user_id=$1 AND membership.active=true AND c.user_id=$1 AND c.archived_at IS NULL
        AND ($2::uuid IS NULL OR g.id=$2)
      ORDER BY g.name,m.character_name,c.character_name`, [userId, guildId ?? null]);
    return result.rows;
  }

  async enable(userId: string, guildId: string, guildMemberId: string, userCharacterId: string, validateIdentity: (row: ReadinessIdentityRow) => boolean) {
    return withTransaction(async (client) => {
      const row = await this.lockEligible(client, userId, guildId, guildMemberId, userCharacterId);
      if (!row || !validateIdentity(row)) throw new GuildDomainError("FORBIDDEN", "This character is not eligible for readiness sharing.");
      await client.query(`UPDATE guild_readiness_shares SET enabled=false,disabled_at=now(),updated_at=now() WHERE guild_id=$1 AND guild_member_id=$2 AND enabled`, [guildId, guildMemberId]);
      const share = await client.query<{ id: string }>(`
        INSERT INTO guild_readiness_shares(guild_id,guild_member_id,user_id,user_character_id,enabled)
        VALUES($1,$2,$3,$4,true)
        ON CONFLICT(guild_id,guild_member_id,user_character_id)
        DO UPDATE SET enabled=true,disabled_at=NULL,updated_at=now()
        RETURNING id`, [guildId, guildMemberId, userId, userCharacterId]);
      await this.audit(client, userId, guildId, guildMemberId, "readiness.share_enabled");
      return share.rows[0].id;
    });
  }

  async disable(userId: string, shareId: string) {
    return withTransaction(async (client) => {
      const share = (await client.query<{ guild_id: string; guild_member_id: string }>(`
        UPDATE guild_readiness_shares SET enabled=false,disabled_at=now(),updated_at=now()
        WHERE id=$1 AND user_id=$2 AND enabled=true
        RETURNING guild_id,guild_member_id`, [shareId, userId])).rows[0];
      if (!share) throw new GuildDomainError("NOT_FOUND", "Readiness share was not found.");
      await this.audit(client, userId, share.guild_id, share.guild_member_id, "readiness.share_disabled");
    });
  }

  async loadRaidRows(guildId: string, raidId: string) {
    const result = await query<RaidReadinessRow>(`
      WITH latest_sync AS (
        SELECT DISTINCT ON (user_character_id) * FROM character_syncs
        WHERE status='success' ORDER BY user_character_id,synced_at DESC,id DESC
      )
      SELECT g.id AS guild_id,g.name AS guild_name,g.content_version AS guild_content_version,
        raid.id AS raid_id,raid.name AS raid_name,raid.instance,raid.starts_at,raid.raid_leader_user_id,
        entry.roster_state,entry.group_name,entry.role_name,m.id AS guild_member_id,m.character_name,
        m.class_name AS roster_class_name,m.spec AS roster_spec,m.role AS roster_role,m.main_name,m.active AS member_active,
        m.region AS member_region,m.realm AS member_realm,m.realm_type AS member_realm_type,m.content_version AS member_content_version,
        share.id AS share_id,share.user_id AS share_user_id,share.user_character_id,share.enabled AS share_enabled,
        membership.active AS share_membership_active,claim.status AS claim_status,
        c.region AS character_region,c.realm_slug,c.realm_name,c.character_name AS saved_character_name,
        c.normalized_character_name,c.character_realm_type,c.content_version AS character_content_version,c.archived_at,
        sync.id AS sync_id,sync.synced_at,sync.level,sync.class_name AS sync_class_name,sync.spec AS sync_spec,
        sync.race AS sync_race,sync.faction AS sync_faction,sync.professions,sync.talents,
        sync.content_version AS sync_content_version,sync.character_realm_type AS sync_realm_type,sync.provider
      FROM raid_events raid
      JOIN guilds g ON g.id=raid.guild_id AND g.archived_at IS NULL
      JOIN raid_roster_entries entry ON entry.raid_event_id=raid.id
      JOIN guild_members m ON m.id=entry.guild_member_id AND m.guild_id=g.id
      LEFT JOIN guild_readiness_shares share ON share.guild_id=g.id AND share.guild_member_id=m.id AND share.enabled=true
      LEFT JOIN guild_workspace_memberships membership ON membership.guild_id=share.guild_id AND membership.user_id=share.user_id
      LEFT JOIN guild_member_links claim ON claim.guild_member_id=share.guild_member_id AND claim.user_id=share.user_id
      LEFT JOIN user_characters c ON c.id=share.user_character_id AND c.user_id=share.user_id
      LEFT JOIN latest_sync sync ON sync.user_character_id=c.id
      WHERE raid.id=$1 AND raid.guild_id=$2
      ORDER BY CASE entry.roster_state WHEN 'selected' THEN 0 ELSE 1 END,entry.position NULLS LAST,m.character_name`, [raidId, guildId]);
    return result.rows;
  }

  async loadSyncItems(syncIds: string[]) {
    if (!syncIds.length) return [];
    return (await query<Record<string, any>>(`SELECT sync_id,slot,item_id,item_name,item_level,quality,icon,stats,enchantments,weapon,set_id,special_effect_id,unique_group,source FROM character_sync_items WHERE sync_id=ANY($1::uuid[]) ORDER BY sync_id,slot`, [syncIds])).rows;
  }

  private async lockEligible(client: PoolClient, userId: string, guildId: string, memberId: string, characterId: string) {
    const result = await client.query<ReadinessIdentityRow>(`
      SELECT g.id AS guild_id,g.name AS guild_name,m.id AS guild_member_id,m.character_name,
        m.region AS member_region,m.realm AS member_realm,m.realm_type AS member_realm_type,m.content_version AS member_content_version,
        c.id AS user_character_id,c.region AS character_region,c.realm_slug,c.normalized_character_name,
        c.character_realm_type,c.content_version AS character_content_version
      FROM guilds g
      JOIN guild_workspace_memberships membership ON membership.guild_id=g.id AND membership.user_id=$1 AND membership.active=true
      JOIN guild_members m ON m.guild_id=g.id AND m.id=$3 AND m.active=true
      JOIN guild_member_links claim ON claim.guild_member_id=m.id AND claim.user_id=$1 AND claim.status='approved'
      JOIN user_characters c ON c.user_id=$1 AND c.id=$4 AND c.archived_at IS NULL
      WHERE g.id=$2 AND g.archived_at IS NULL
      FOR UPDATE OF membership,m,claim,c`, [userId, guildId, memberId, characterId]);
    return result.rows[0];
  }

  private audit(client: PoolClient, userId: string, guildId: string, guildMemberId: string, action: string) {
    return client.query(`INSERT INTO audit_events(actor_user_id,guild_id,entity_type,entity_id,action,summary) VALUES($1,$2,'guild_member',$3,$4,$5)`, [userId, guildId, guildMemberId, action, JSON.stringify({ guildMemberId })]);
  }
}

export const guildReadinessRepository = new GuildReadinessRepository();
