"use client";
import Link from "next/link";
import { useState } from "react";
import type { ContentVersion } from "../lib/types";
import { calendarEventStatus, eventStartKey, filterCalendarEvents } from "../lib/calendar/service";
import type { CalendarCategoryFilter, CalendarDisplayRegion, GameCalendarEvent } from "../lib/calendar/types";

const filters: { value: CalendarCategoryFilter; label: string }[] = [
  { value: "all", label: "All" }, { value: "battlegrounds", label: "Battlegrounds" }, { value: "holidays", label: "Holidays" }, { value: "darkmoon-faire", label: "Darkmoon Faire" }, { value: "world-seasonal", label: "World / Seasonal" },
];
const categoryLabels: Record<GameCalendarEvent["category"], string> = { battleground: "Battleground", "darkmoon-faire": "Darkmoon Faire", holiday: "Holiday", seasonal: "Seasonal", "world-event": "World event", special: "Special", other: "Other" };

function displayDate(value: string, includeYear = false) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", ...(includeYear ? { year: "numeric" as const } : {}), timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
function dateLabel(event: GameCalendarEvent) {
  if (event.timing.kind === "date-range") return event.timing.endsOn ? `${displayDate(event.timing.startsOn)} – ${displayDate(event.timing.endsOn, event.timing.startsOn.slice(0, 4) !== event.timing.endsOn.slice(0, 4))}` : displayDate(event.timing.startsOn);
  const format = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC", timeZoneName: "short" }).format(new Date(value));
  return event.timing.endsAt ? `${format(event.timing.startsAt)} – ${format(event.timing.endsAt)}` : format(event.timing.startsAt);
}

export function GameCalendar({ version, region, events, nowIso }: { version: ContentVersion; region: CalendarDisplayRegion; events: readonly GameCalendarEvent[]; nowIso: string }) {
  const [filter, setFilter] = useState<CalendarCategoryFilter>("all"); const now = new Date(nowIso);
  const visible = filterCalendarEvents(events, { version, region, category: filter });
  const active = visible.filter((event) => calendarEventStatus(event, now, region) === "active");
  const coming = visible.filter((event) => calendarEventStatus(event, now, region) === "upcoming");
  const grouped = coming.reduce<Record<string, GameCalendarEvent[]>>((months, event) => { const month = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${eventStartKey(event).slice(0, 10)}T12:00:00Z`)); (months[month] ??= []).push(event); return months; }, {});
  return <>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1" role="group" aria-label="Calendar region">{(["eu", "us"] as const).map((item) => <Link key={item} href={`/${version}/calendar?region=${item}`} aria-current={region === item ? "true" : undefined} className={`focus-ring rounded-full px-4 py-2 text-xs font-bold ${region === item ? "bg-[var(--accent)] text-[var(--background)]" : "text-[var(--muted)]"}`}>{item.toUpperCase()}</Link>)}</div><p className="text-xs text-[var(--muted)]">Dates use {region.toUpperCase()} calendar context. No location inference.</p></div>
    <fieldset className="mt-6"><legend className="sr-only">Filter event categories</legend><div className="flex flex-wrap gap-2">{filters.map((item) => <button type="button" key={item.value} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value} className={`focus-ring rounded-full border px-3 py-2 text-xs ${filter === item.value ? "border-[var(--accent)] text-[var(--accent-hover)]" : "border-[var(--border)] text-[var(--muted)]"}`}>{item.label}</button>)}</div></fieldset>
    <section className="mt-10" aria-labelledby="happening-now"><div className="eyebrow">Right now</div><h2 id="happening-now" className="display mt-2 text-3xl">Happening now</h2>{active.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{active.map((event) => <EventCard key={event.id} event={event} status="active" />)}</div> : <p className="panel mt-5 rounded-xl p-5 text-sm text-[var(--muted)]">No tracked game events are active right now.</p>}</section>
    <section className="mt-12" aria-labelledby="coming-up"><div className="eyebrow">Verified schedule</div><h2 id="coming-up" className="display mt-2 text-3xl">Coming up</h2>{coming.length ? <div className="mt-6 space-y-10">{Object.entries(grouped).map(([month, monthEvents]) => <section key={month}><h3 className="display text-2xl">{month}</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{monthEvents.map((event) => <EventCard key={event.id} event={event} status="upcoming" />)}</div></section>)}</div> : <p className="panel mt-5 rounded-xl p-5 text-sm text-[var(--muted)]">No verified upcoming events are currently listed for this region and filter.</p>}</section>
  </>;
}

function EventCard({ event, status }: { event: GameCalendarEvent; status: "active" | "upcoming" }) { return <article className="panel min-w-0 rounded-2xl p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-hover)]">{categoryLabels[event.category]}</span><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{status === "active" ? "Active" : "Upcoming"} · {event.region.toUpperCase()}</span></div><h3 className="display mt-3 text-2xl">{event.title}</h3><p className="mt-2 text-sm font-semibold text-[var(--text)]"><time>{dateLabel(event)}</time></p>{event.shortDescription && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{event.shortDescription}</p>}{event.locationLabel && <p className="mt-2 text-xs text-[var(--muted)]">Location: {event.locationLabel}</p>}<details className="mt-4 border-t border-[var(--border)] pt-4"><summary className="focus-ring cursor-pointer text-xs font-bold text-[var(--accent-hover)]">Source and verification</summary><div className="mt-3 text-xs leading-5 text-[var(--muted)]"><p>Verified {displayDate(event.source.verifiedAt, true)}.</p>{event.source.url ? <a className="focus-ring mt-1 inline-block break-words underline" href={event.source.url} target="_blank" rel="noreferrer">View source: {event.source.label}</a> : <p>{event.source.label}</p>}</div></details></article>; }
