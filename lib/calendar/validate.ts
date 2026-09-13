import { calendarCategories, calendarRegions, type GameCalendarEvent } from "./types.ts";

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const versions = new Set(["era", "tbc"]);

function validDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateCalendarEvents(events: readonly GameCalendarEvent[]): string[] {
  const errors: string[] = []; const ids = new Set<string>(); const occurrences = new Set<string>();
  for (const event of events) {
    const at = event.id || "<missing id>";
    if (!idPattern.test(event.id)) errors.push(`${at}: invalid id`);
    if (ids.has(event.id)) errors.push(`${at}: duplicate id`); ids.add(event.id);
    if (!idPattern.test(event.familyId)) errors.push(`${at}: invalid familyId`);
    if (!versions.has(event.contentVersion)) errors.push(`${at}: unrecognized contentVersion`);
    if (!(calendarRegions as readonly string[]).includes(event.region)) errors.push(`${at}: unrecognized region`);
    if (!(calendarCategories as readonly string[]).includes(event.category)) errors.push(`${at}: unrecognized category`);
    if (!event.title.trim()) errors.push(`${at}: title is required`);
    if (!event.source?.label?.trim()) errors.push(`${at}: source label is required`);
    if (!validDate(event.source?.verifiedAt ?? "")) errors.push(`${at}: verifiedAt must be a real YYYY-MM-DD date`);
    if (event.source?.url) { try { const url = new URL(event.source.url); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { errors.push(`${at}: source URL must be http(s)`); } }
    let start = ""; let end = "";
    if (event.timing.kind === "date-range") {
      start = event.timing.startsOn; end = event.timing.endsOn ?? start;
      if (!validDate(start) || !validDate(end)) errors.push(`${at}: date range must contain real YYYY-MM-DD dates`);
    } else if (event.timing.kind === "instant-range") {
      start = event.timing.startsAt; end = event.timing.endsAt ?? start;
      if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || !/(?:Z|[+-]\d\d:\d\d)$/.test(start) || !/(?:Z|[+-]\d\d:\d\d)$/.test(end)) errors.push(`${at}: instant range must contain offset-aware ISO instants`);
    } else errors.push(`${at}: unrecognized timing kind`);
    if (start && end && end < start) errors.push(`${at}: end precedes start`);
    const signature = `${event.familyId}|${event.contentVersion}|${event.region}|${event.timing.kind}|${start}|${end}`;
    if (occurrences.has(signature)) errors.push(`${at}: duplicates an existing family/version/region occurrence`); occurrences.add(signature);
  }
  return errors;
}
