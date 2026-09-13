import type { ContentVersion } from "../types";
import type { CalendarCategoryFilter, CalendarDisplayRegion, GameCalendarEvent, GameCalendarStatus } from "./types";

export const DEFAULT_CALENDAR_REGION: CalendarDisplayRegion = "eu";
const regionTimeZones: Record<CalendarDisplayRegion, string> = { eu: "Europe/Paris", us: "America/Los_Angeles" };

export function parseCalendarRegion(value: string | string[] | undefined): CalendarDisplayRegion {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "us" ? "us" : DEFAULT_CALENDAR_REGION;
}

export function currentCalendarNow(): Date { return new Date(); }

function localDate(now: Date, region: CalendarDisplayRegion): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: regionTimeZones[region], year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function calendarEventStatus(event: GameCalendarEvent, now: Date, region: CalendarDisplayRegion): GameCalendarStatus {
  if (event.timing.kind === "date-range") {
    const today = localDate(now, region); const end = event.timing.endsOn ?? event.timing.startsOn;
    return today < event.timing.startsOn ? "upcoming" : today > end ? "ended" : "active";
  }
  const time = now.getTime(); const start = Date.parse(event.timing.startsAt); const end = event.timing.endsAt ? Date.parse(event.timing.endsAt) : start;
  return time < start ? "upcoming" : time > end ? "ended" : "active";
}

export function eventStartKey(event: GameCalendarEvent): string { return event.timing.kind === "date-range" ? event.timing.startsOn : event.timing.startsAt; }
export function eventEndKey(event: GameCalendarEvent): string { return event.timing.kind === "date-range" ? (event.timing.endsOn ?? event.timing.startsOn) : (event.timing.endsAt ?? event.timing.startsAt); }

export function sortCalendarEvents(events: readonly GameCalendarEvent[]): GameCalendarEvent[] {
  return [...events].sort((a, b) => eventStartKey(a).localeCompare(eventStartKey(b)) || eventEndKey(a).localeCompare(eventEndKey(b)) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function filterCalendarEvents(events: readonly GameCalendarEvent[], options: { version: ContentVersion; region: CalendarDisplayRegion; category?: CalendarCategoryFilter }): GameCalendarEvent[] {
  const categories: Record<Exclude<CalendarCategoryFilter, "all">, readonly string[]> = { battlegrounds: ["battleground"], holidays: ["holiday"], "darkmoon-faire": ["darkmoon-faire"], "world-seasonal": ["seasonal", "world-event", "special", "other"] };
  return sortCalendarEvents(events.filter((event) => event.contentVersion === options.version && (event.region === "global" || event.region === options.region) && (!options.category || options.category === "all" || categories[options.category].includes(event.category))));
}

export function selectDashboardEvents(events: readonly GameCalendarEvent[], version: ContentVersion, region: CalendarDisplayRegion, now: Date, limit = 3): GameCalendarEvent[] {
  return filterCalendarEvents(events, { version, region }).filter((event) => calendarEventStatus(event, now, region) !== "ended").slice(0, limit);
}
