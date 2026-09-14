import type { ContentVersion } from "../types.ts";
import type { GuildScheduleEntry, UnscheduledPrepRun } from "../guilds/schedule.ts";
import { getGuildToday } from "../guilds/time.ts";
import { calendarDateInRegion, calendarEventStatus, filterCalendarEvents } from "./service.ts";
import type { CalendarCategoryFilter, CalendarDisplayRegion, GameCalendarEvent } from "./types.ts";

export type UnifiedCalendarFilter = CalendarCategoryFilter | "guild";

export type UnifiedGameCalendarEntry = Pick<GameCalendarEvent, "id" | "title" | "shortDescription" | "category" | "region" | "timing" | "locationLabel" | "source"> & {
  kind: "game-event";
  status: "active" | "upcoming";
  dateKey: string;
};

export type UnifiedGuildCalendarEntry = {
  kind: "raid" | "prep-run";
  id: string;
  title: string;
  scheduledFor: string;
  guildLocalDate: string;
  guildLocalTime: string;
  dateKey: string;
  status: string;
  href: string;
};

export type UnifiedCalendarEntry = UnifiedGameCalendarEntry | UnifiedGuildCalendarEntry;

export type UnifiedUnscheduledPrepRun = {
  kind: "prep-run";
  id: string;
  title: string;
  raidName: string;
  href: string;
};

export type UnifiedCalendarProjection = {
  guildId: string;
  guildName: string;
  guildTimeZone: string;
  gameRegion: CalendarDisplayRegion;
  guildToday: string;
  happeningNow: UnifiedCalendarEntry[];
  upcoming: UnifiedCalendarEntry[];
  unscheduled: UnifiedUnscheduledPrepRun[];
};

type ScheduleProjectionInput = {
  guildId: string;
  guildName: string;
  timeZone: string;
  entries: GuildScheduleEntry[];
  unscheduled: UnscheduledPrepRun[];
};

function gameDateKey(event: GameCalendarEvent, region: CalendarDisplayRegion) {
  return event.timing.kind === "date-range"
    ? event.timing.startsOn
    : calendarDateInRegion(new Date(event.timing.startsAt), region);
}

function guildEntry(entry: GuildScheduleEntry, version: ContentVersion, guildId: string): UnifiedGuildCalendarEntry {
  return {
    kind: entry.type,
    id: entry.id,
    title: entry.title,
    scheduledFor: entry.scheduledFor,
    guildLocalDate: entry.guildLocalDate,
    guildLocalTime: entry.guildLocalTime,
    dateKey: entry.guildLocalDate,
    status: entry.status,
    href: entry.type === "raid"
      ? `/${version}/guilds/${guildId}/raids/${entry.linkedRaidId}`
      : `/${version}/guilds/${guildId}/prep/${entry.prepRunId}`,
  };
}

function compareUpcoming(left: UnifiedCalendarEntry, right: UnifiedCalendarEntry) {
  const date = left.dateKey.localeCompare(right.dateKey);
  if (date) return date;
  const leftGuild = left.kind === "game-event" ? 1 : 0;
  const rightGuild = right.kind === "game-event" ? 1 : 0;
  if (leftGuild !== rightGuild) return leftGuild - rightGuild;
  if (left.kind !== "game-event" && right.kind !== "game-event") {
    const time = left.guildLocalTime.localeCompare(right.guildLocalTime);
    if (time) return time;
  }
  return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
}

function compareHappening(left: UnifiedCalendarEntry, right: UnifiedCalendarEntry) {
  const leftGame = left.kind === "game-event" ? 0 : 1;
  const rightGame = right.kind === "game-event" ? 0 : 1;
  return leftGame - rightGame || compareUpcoming(left, right);
}

export function buildUnifiedCalendarProjection(input: {
  version: ContentVersion;
  region: CalendarDisplayRegion;
  gameEvents: readonly GameCalendarEvent[];
  schedule: ScheduleProjectionInput;
  now: Date;
}): UnifiedCalendarProjection {
  const guildToday = getGuildToday(input.schedule.timeZone, input.now);
  const gameEntries = filterCalendarEvents(input.gameEvents, { version: input.version, region: input.region })
    .map((event): UnifiedGameCalendarEntry | undefined => {
      const status = calendarEventStatus(event, input.now, input.region);
      if (status === "ended") return undefined;
      return {
        kind: "game-event",
        id: event.id,
        title: event.title,
        shortDescription: event.shortDescription,
        category: event.category,
        region: event.region,
        timing: event.timing,
        locationLabel: event.locationLabel,
        source: { ...event.source },
        status,
        dateKey: gameDateKey(event, input.region),
      };
    })
    .filter((entry): entry is UnifiedGameCalendarEntry => Boolean(entry));
  const guildEntries = input.schedule.entries
    .filter((entry) => entry.type === "raid" ? entry.status !== "complete" : entry.status === "open")
    .map((entry) => guildEntry(entry, input.version, input.schedule.guildId));

  return {
    guildId: input.schedule.guildId,
    guildName: input.schedule.guildName,
    guildTimeZone: input.schedule.timeZone,
    gameRegion: input.region,
    guildToday,
    happeningNow: [
      ...gameEntries.filter((entry) => entry.status === "active"),
      ...guildEntries.filter((entry) => entry.guildLocalDate === guildToday),
    ].sort(compareHappening),
    upcoming: [
      ...gameEntries.filter((entry) => entry.status === "upcoming"),
      ...guildEntries.filter((entry) => entry.guildLocalDate > guildToday),
    ].sort(compareUpcoming),
    unscheduled: input.schedule.unscheduled.map((run) => ({
      kind: "prep-run",
      id: run.id,
      title: run.title,
      raidName: run.raidName,
      href: `/${input.version}/guilds/${input.schedule.guildId}/prep/${run.id}`,
    })),
  };
}

const groupedCategories: Record<Exclude<CalendarCategoryFilter, "all">, readonly GameCalendarEvent["category"][]> = {
  battlegrounds: ["battleground"],
  holidays: ["holiday"],
  "darkmoon-faire": ["darkmoon-faire"],
  "world-seasonal": ["seasonal", "world-event", "special", "other"],
};

export function filterUnifiedCalendar(projection: UnifiedCalendarProjection, filter: UnifiedCalendarFilter) {
  const include = (entry: UnifiedCalendarEntry) => {
    if (filter === "all") return true;
    if (filter === "guild") return entry.kind !== "game-event";
    return entry.kind === "game-event" && groupedCategories[filter].includes(entry.category);
  };
  return {
    happeningNow: projection.happeningNow.filter(include),
    upcoming: projection.upcoming.filter(include),
    unscheduled: filter === "all" || filter === "guild" ? projection.unscheduled : [],
  };
}

export function selectUnifiedDashboardEntries(
  projection: UnifiedCalendarProjection,
  limit = 3,
) {
  if (limit <= 0) return [];
  const entries = [...projection.happeningNow, ...projection.upcoming];
  const guildEntries = entries.filter((entry) => entry.kind !== "game-event");
  if (!guildEntries.length) return entries.slice(0, limit);

  const selected = new Set<UnifiedCalendarEntry>(guildEntries.slice(0, limit - 1));
  const gameEntry = entries.find((entry) => entry.kind === "game-event");
  if (gameEntry) selected.add(gameEntry);
  for (const entry of entries) {
    if (selected.size >= limit) break;
    selected.add(entry);
  }
  return entries.filter((entry) => selected.has(entry)).slice(0, limit);
}
