import Link from "next/link";
import { getCalendarEvents } from "../lib/calendar/registry";
import { calendarEventStatus, currentCalendarNow, DEFAULT_CALENDAR_REGION, selectDashboardEvents } from "../lib/calendar/service";
import type { ContentVersion } from "../lib/types";

export function CalendarPreview({ version }: { version: ContentVersion }) {
  const now = currentCalendarNow(); const events = selectDashboardEvents(getCalendarEvents(version), version, DEFAULT_CALENDAR_REGION, now);
  return <section className="panel mt-8 rounded-2xl p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">Game calendar · EU</div><h2 className="display mt-2 text-3xl">Coming Up in {version === "era" ? "Era" : "TBC"}</h2></div><Link className="button-secondary" href={`/${version}/calendar?region=${DEFAULT_CALENDAR_REGION}`}>View Calendar</Link></div>{events.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-3">{events.map((event) => <li className="rounded-xl border border-[var(--border)] p-4" key={event.id}><p className="font-semibold">{event.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{calendarEventStatus(event, now, DEFAULT_CALENDAR_REGION) === "active" ? "Happening now" : `Starts ${formatStart(event)}`}</p></li>)}</ul> : <p className="mt-4 text-sm text-[var(--muted)]">No verified upcoming events are currently listed.</p>}</section>;
}

function formatStart(event: ReturnType<typeof selectDashboardEvents>[number]) { const value = event.timing.kind === "date-range" ? `${event.timing.startsOn}T12:00:00Z` : event.timing.startsAt; return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(value)); }
