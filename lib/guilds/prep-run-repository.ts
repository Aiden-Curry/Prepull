import type { PoolClient } from "pg";
import { query, withTransaction } from "./db.ts";
import { GuildDomainError } from "./errors.ts";
import type {
  CreatePrepRunInput,
  PrepRunSignupStatus,
  PrepRunStatus,
} from "./prep-run-types.ts";

const iso = (value: any) => value?.toISOString?.() ?? String(value);

export class PrepRunRepository {
  async getGuildTimeZone(guildId: string) {
    return (
      (
        await query<{ raid_timezone: string }>(
          "SELECT raid_timezone FROM guilds WHERE id=$1 AND archived_at IS NULL",
          [guildId],
        )
      ).rows[0]?.raid_timezone ?? "UTC"
    );
  }

  async getMembership(userId: string, guildId: string) {
    return (
      await query<Record<string, any>>(
        `
      SELECT membership.*,guild.name AS guild_name
      FROM guild_workspace_memberships membership
      JOIN guilds guild ON guild.id=membership.guild_id AND guild.archived_at IS NULL
      WHERE membership.user_id=$1 AND membership.guild_id=$2 AND membership.active=true`,
        [userId, guildId],
      )
    ).rows[0];
  }

  async getRaid(guildId: string, raidId: string) {
    return (
      await query<Record<string, any>>(
        `SELECT * FROM raid_events WHERE id=$1 AND guild_id=$2`,
        [raidId, guildId],
      )
    ).rows[0];
  }

  async findOpen(guildId: string, raidId: string, activityKey: string) {
    return (
      await query<{ id: string }>(
        `SELECT id FROM guild_prep_runs WHERE guild_id=$1 AND raid_id=$2 AND activity_key=$3 AND status='open'`,
        [guildId, raidId, activityKey],
      )
    ).rows[0]?.id;
  }

  async create(actorUserId: string, input: CreatePrepRunInput) {
    return withTransaction(async (client) => {
      const result = await client.query<{ id: string }>(
        `
        INSERT INTO guild_prep_runs(guild_id,raid_id,activity_key,activity_label,activity_category,scheduled_for,note,created_by_membership_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          input.guildId,
          input.raidId,
          input.activityKey,
          input.activityLabel,
          input.activityCategory,
          input.scheduledFor ?? null,
          input.note,
          input.creatorMembershipId,
        ],
      );
      await this.audit(
        client,
        actorUserId,
        input.guildId,
        result.rows[0].id,
        "prep_run.created",
        { raidId: input.raidId, activityKey: input.activityKey },
      );
      return result.rows[0].id;
    });
  }

  async list(guildId: string) {
    return (
      await query<Record<string, any>>(
        `
      SELECT run.*,raid.name AS raid_name,raid.instance AS raid_instance,guild.raid_timezone,
        COALESCE(organizer.name,'Former guild member') AS organizer_name,
        count(signup.id) FILTER (WHERE signup.status='going' AND participant.id IS NOT NULL)::int AS going_count,
        count(signup.id) FILTER (WHERE signup.status='maybe' AND participant.id IS NOT NULL)::int AS maybe_count
      FROM guild_prep_runs run
      JOIN guilds guild ON guild.id=run.guild_id AND guild.archived_at IS NULL
      JOIN raid_events raid ON raid.id=run.raid_id AND raid.guild_id=run.guild_id
      LEFT JOIN guild_workspace_memberships creator ON creator.id=run.created_by_membership_id AND creator.guild_id=run.guild_id
      LEFT JOIN users organizer ON organizer.id=creator.user_id
      LEFT JOIN guild_prep_run_signups signup ON signup.prep_run_id=run.id
      LEFT JOIN guild_workspace_memberships participant ON participant.id=signup.membership_id AND participant.active=true
      WHERE run.guild_id=$1
      GROUP BY run.id,raid.name,raid.instance,guild.raid_timezone,organizer.name
      ORDER BY CASE run.status WHEN 'open' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,
        run.scheduled_for ASC NULLS LAST,run.created_at DESC`,
        [guildId],
      )
    ).rows.map((row) => this.map(row));
  }

  async get(guildId: string, runId: string) {
    const row = (
      await query<Record<string, any>>(
        `
      SELECT run.*,guild.name AS guild_name,guild.raid_timezone,raid.name AS raid_name,raid.instance AS raid_instance,raid.raid_leader_user_id,
        COALESCE(organizer.name,'Former guild member') AS organizer_name
      FROM guild_prep_runs run
      JOIN guilds guild ON guild.id=run.guild_id AND guild.archived_at IS NULL
      JOIN raid_events raid ON raid.id=run.raid_id AND raid.guild_id=run.guild_id
      LEFT JOIN guild_workspace_memberships creator ON creator.id=run.created_by_membership_id AND creator.guild_id=run.guild_id
      LEFT JOIN users organizer ON organizer.id=creator.user_id
      WHERE run.guild_id=$1 AND run.id=$2`,
        [guildId, runId],
      )
    ).rows[0];
    return row
      ? {
          ...this.map(row),
          guildName: row.guild_name,
          raidLeaderUserId: row.raid_leader_user_id,
        }
      : undefined;
  }

  async participants(guildId: string, runId: string) {
    return (
      await query<Record<string, any>>(
        `
      SELECT membership.id AS membership_id,user_account.name AS display_name,signup.status
      FROM guild_prep_run_signups signup
      JOIN guild_workspace_memberships membership ON membership.id=signup.membership_id AND membership.guild_id=signup.guild_id AND membership.active=true
      JOIN users user_account ON user_account.id=membership.user_id AND user_account.active=true
      WHERE signup.guild_id=$1 AND signup.prep_run_id=$2
      ORDER BY CASE signup.status WHEN 'going' THEN 0 ELSE 1 END,user_account.name,membership.id`,
        [guildId, runId],
      )
    ).rows;
  }

  async activeMemberCount(guildId: string) {
    return (
      (
        await query<{ count: number }>(
          `SELECT count(*)::int AS count FROM guild_workspace_memberships membership JOIN users user_account ON user_account.id=membership.user_id AND user_account.active=true WHERE membership.guild_id=$1 AND membership.active=true`,
          [guildId],
        )
      ).rows[0]?.count ?? 0
    );
  }

  async claimedCharacterIds(userId: string, guildId: string) {
    return (
      await query<{ guild_member_id: string }>(
        `
      SELECT claim.guild_member_id FROM guild_member_links claim
      JOIN guild_members member ON member.id=claim.guild_member_id AND member.guild_id=$2 AND member.active=true
      WHERE claim.user_id=$1 AND claim.status='approved'`,
        [userId, guildId],
      )
    ).rows.map((row) => row.guild_member_id);
  }

  async update(
    actorUserId: string,
    guildId: string,
    runId: string,
    scheduledFor: string | undefined,
    note: string,
  ) {
    return withTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE guild_prep_runs SET scheduled_for=$1,note=$2,updated_at=now() WHERE guild_id=$3 AND id=$4 AND status='open'`,
        [scheduledFor ?? null, note, guildId, runId],
      );
      if (!updated.rowCount)
        throw new GuildDomainError(
          "CONFLICT",
          "Only an open Prep Run can be edited.",
        );
      await this.audit(
        client,
        actorUserId,
        guildId,
        runId,
        "prep_run.updated",
        { fields: ["scheduledFor", "note"] },
      );
    });
  }

  async setStatus(
    actorUserId: string,
    guildId: string,
    runId: string,
    status: Exclude<PrepRunStatus, "open">,
  ) {
    return withTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE guild_prep_runs SET status=$1,updated_at=now() WHERE guild_id=$2 AND id=$3 AND status='open'`,
        [status, guildId, runId],
      );
      if (!updated.rowCount)
        throw new GuildDomainError(
          "CONFLICT",
          "This Prep Run is already closed.",
        );
      await this.audit(
        client,
        actorUserId,
        guildId,
        runId,
        `prep_run.${status}`,
        {},
      );
    });
  }

  async setSignup(
    guildId: string,
    runId: string,
    membershipId: string,
    status: PrepRunSignupStatus,
  ) {
    const result = await query<{ id: string }>(
      `
      INSERT INTO guild_prep_run_signups(guild_id,prep_run_id,membership_id,status)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(prep_run_id,membership_id) DO UPDATE SET status=excluded.status,updated_at=now()
      RETURNING id`,
      [guildId, runId, membershipId, status],
    );
    return result.rows[0].id;
  }

  async removeSignup(guildId: string, runId: string, membershipId: string) {
    await query(
      `DELETE FROM guild_prep_run_signups WHERE guild_id=$1 AND prep_run_id=$2 AND membership_id=$3`,
      [guildId, runId, membershipId],
    );
  }

  private map(row: Record<string, any>) {
    return {
      id: row.id,
      guildId: row.guild_id,
      raidId: row.raid_id,
      raidName: row.raid_name,
      raidInstance: row.raid_instance,
      guildTimeZone: row.raid_timezone ?? "UTC",
      activityKey: row.activity_key,
      activityLabel: row.activity_label,
      activityCategory: row.activity_category,
      scheduledFor: row.scheduled_for ? iso(row.scheduled_for) : undefined,
      note: row.note,
      status: row.status,
      organizerName: row.organizer_name,
      goingCount: Number(row.going_count ?? 0),
      maybeCount: Number(row.maybe_count ?? 0),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    };
  }

  private audit(
    client: PoolClient,
    actorUserId: string,
    guildId: string,
    runId: string,
    action: string,
    summary: Record<string, unknown>,
  ) {
    return client.query(
      `INSERT INTO audit_events(actor_user_id,guild_id,entity_type,entity_id,action,summary) VALUES($1,$2,'guild_prep_run',$3,$4,$5)`,
      [actorUserId, guildId, runId, action, JSON.stringify(summary)],
    );
  }
}

export const prepRunRepository = new PrepRunRepository();
