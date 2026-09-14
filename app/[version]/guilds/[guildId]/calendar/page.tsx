import Link from "next/link";
import { notFound } from "next/navigation";
import { UnifiedCalendar } from "../../../../../components/unified-calendar";
import { VersionShell } from "../../../../../components/version-shell";
import { getCalendarEvents } from "../../../../../lib/calendar/registry";
import { currentCalendarNow, parseCalendarRegion } from "../../../../../lib/calendar/service";
import { buildUnifiedCalendarProjection } from "../../../../../lib/calendar/unified";
import { isContentVersion } from "../../../../../lib/game-data";
import { requireUser } from "../../../../../lib/guilds/auth";
import { getGuildSchedule } from "../../../../../lib/guilds/schedule";
import type { ContentVersion } from "../../../../../lib/types";

export default async function UnifiedGuildCalendarPage({ params, searchParams }: { params: Promise<{ version: string; guildId: string }>; searchParams: Promise<{ region?: string | string[] }> }) {
  const resolved = await params;
  if (!isContentVersion(resolved.version)) notFound();
  const version = resolved.version as ContentVersion;
  const region = parseCalendarRegion((await searchParams).region);
  const user = await requireUser();
  const now = currentCalendarNow();
  let schedule;
  try { schedule = await getGuildSchedule(user.id, resolved.guildId, now); } catch { notFound(); }
  const projection = buildUnifiedCalendarProjection({ version, region, gameEvents: getCalendarEvents(version), schedule, now });
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-4xl px-5 py-12 lg:px-8"><nav aria-label="Guild calendar navigation" className="flex flex-wrap gap-4 text-xs text-[var(--muted)]"><Link href={`/${version}/guilds/${resolved.guildId}`}>← Guild workspace</Link><Link href={`/${version}/guilds/${resolved.guildId}/schedule?region=${region}`}>Guild Schedule</Link><Link href={`/${version}/guilds/${resolved.guildId}/raids`}>Raids</Link><Link href={`/${version}/guilds/${resolved.guildId}/prep`}>Prep Runs</Link></nav><header className="mt-8"><p className="eyebrow">{projection.guildName}</p><h1 className="display mt-2 text-4xl">Calendar</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Game events and this guild’s scheduled raids and Prep Runs in one view. Game dates use the selected region; guild times use <strong>{projection.guildTimeZone}</strong>.</p><Link className="button-secondary mt-4 inline-flex" href={`/${version}/calendar?region=${region}`}>View Game Calendar</Link></header><UnifiedCalendar version={version} projection={projection} /></main></VersionShell>;
}
