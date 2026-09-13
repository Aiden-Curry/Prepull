import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../components/version-shell";
import { GameCalendar } from "../../../components/game-calendar";
import { getCalendarEvents } from "../../../lib/calendar/registry";
import { currentCalendarNow, parseCalendarRegion } from "../../../lib/calendar/service";
import { isContentVersion } from "../../../lib/game-data";
import type { ContentVersion } from "../../../lib/types";

export async function generateMetadata({ params }: { params: Promise<{ version: string }> }): Promise<Metadata> {
  const { version } = await params; if (!isContentVersion(version)) return {};
  const label = version === "era" ? "Classic Era" : "TBC Classic";
  return { title: `PrePull ${label} Calendar`, description: `Verified ${label} game events, holidays, battleground weekends, and Darkmoon Faire dates.` };
}

export default async function CalendarPage({ params, searchParams }: { params: Promise<{ version: string }>; searchParams: Promise<{ region?: string | string[] }> }) {
  const { version: raw } = await params; if (!isContentVersion(raw)) notFound(); const version = raw as ContentVersion;
  const region = parseCalendarRegion((await searchParams).region); const now = currentCalendarNow();
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-[1000px] px-5 py-12 lg:px-8 lg:py-16"><header><div className="eyebrow">{version === "era" ? "Classic Era" : "The Burning Crusade"}</div><h1 className="display mt-3 text-5xl tracking-[-.04em]">Game Calendar</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">A curated schedule of verified world events. Game dates stay separate from guild raids, Prep Runs, and Guild Schedule.</p></header><GameCalendar version={version} region={region} events={getCalendarEvents(version)} nowIso={now.toISOString()} /></main></VersionShell>;
}
