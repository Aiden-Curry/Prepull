import { query } from "./db.ts";
import { GuildDomainError } from "./errors.ts";
import { getGuildRepository, repositoryDriver } from "./factory.ts";
import { instantToGuildLocalInput } from "./time.ts";

export type GuildScheduleEntry = {
  id: string;
  type: "raid" | "prep-run";
  title: string;
  scheduledFor: string;
  guildLocalDate: string;
  guildLocalTime: string;
  linkedRaidId?: string;
  prepRunId?: string;
  status: string;
};

export type UnscheduledPrepRun = {
  id: string;
  title: string;
  linkedRaidId: string;
  raidName: string;
};

type ScheduleRow = {
  id: string;
  entry_type: "raid" | "prep-run";
  title: string;
  scheduled_for: Date | string | null;
  linked_raid_id: string;
  status: string;
  raid_name: string;
};

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export async function getGuildSchedule(
  userId: string,
  guildId: string,
  now: Date = new Date(),
) {
  if (repositoryDriver() === "memory") {
    const workspace = await getGuildRepository().getWorkspace(userId, guildId);
    const timeZone = workspace.guild.raidTimezone ?? "UTC";
    const entries = workspace.events
      .filter(
        (event) =>
          event.status !== "complete" &&
          new Date(event.startsAt).getTime() >= now.getTime(),
      )
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() -
            new Date(right.startsAt).getTime() ||
          left.name.localeCompare(right.name) ||
          left.id.localeCompare(right.id),
      )
      .map((event): GuildScheduleEntry => {
        const scheduledFor = new Date(event.startsAt).toISOString();
        const local = instantToGuildLocalInput(scheduledFor, timeZone);
        return {
          id: event.id,
          type: "raid",
          title: event.name,
          scheduledFor,
          guildLocalDate: local.localDate,
          guildLocalTime: local.localTime,
          linkedRaidId: event.id,
          status: event.status,
        };
      });
    return {
      guildId,
      guildName: workspace.guild.name,
      timeZone,
      entries,
      unscheduled: [] as UnscheduledPrepRun[],
    };
  }
  const context = (
    await query<{ name: string; raid_timezone: string }>(
      `SELECT guild.name,guild.raid_timezone
       FROM guilds guild
       JOIN guild_workspace_memberships membership
         ON membership.guild_id=guild.id
        AND membership.user_id=$2
        AND membership.active=true
       WHERE guild.id=$1 AND guild.archived_at IS NULL`,
      [guildId, userId],
    )
  ).rows[0];
  if (!context)
    throw new GuildDomainError("NOT_FOUND", "Guild schedule was not found.");

  const rows = (
    await query<ScheduleRow>(
      `SELECT raid.id,'raid'::text AS entry_type,raid.name AS title,
              raid.starts_at AS scheduled_for,raid.id AS linked_raid_id,
              raid.status,raid.name AS raid_name
         FROM raid_events raid
        WHERE raid.guild_id=$1
          AND raid.status <> 'complete'
          AND raid.starts_at >= $2
       UNION ALL
       SELECT run.id,'prep-run'::text AS entry_type,run.activity_label AS title,
              run.scheduled_for,run.raid_id AS linked_raid_id,
              run.status,raid.name AS raid_name
         FROM guild_prep_runs run
         JOIN raid_events raid ON raid.id=run.raid_id
        WHERE run.guild_id=$1 AND run.status='open'
          AND (run.scheduled_for IS NULL OR run.scheduled_for >= $2)
       ORDER BY scheduled_for ASC NULLS LAST,entry_type ASC,title ASC,id ASC
       LIMIT 250`,
      [guildId, now.toISOString()],
    )
  ).rows;

  const entries: GuildScheduleEntry[] = rows
    .filter((row) => row.scheduled_for)
    .map((row) => {
      const scheduledFor = iso(row.scheduled_for!);
      const local = instantToGuildLocalInput(
        scheduledFor,
        context.raid_timezone,
      );
      return {
        id: row.id,
        type: row.entry_type,
        title: row.title,
        scheduledFor,
        guildLocalDate: local.localDate,
        guildLocalTime: local.localTime,
        linkedRaidId: row.linked_raid_id,
        prepRunId: row.entry_type === "prep-run" ? row.id : undefined,
        status: row.status,
      };
    });
  const unscheduled: UnscheduledPrepRun[] = rows
    .filter((row) => row.entry_type === "prep-run" && !row.scheduled_for)
    .map((row) => ({
      id: row.id,
      title: row.title,
      linkedRaidId: row.linked_raid_id,
      raidName: row.raid_name,
    }));

  return {
    guildId,
    guildName: context.name,
    timeZone: context.raid_timezone || "UTC",
    entries,
    unscheduled,
  };
}
