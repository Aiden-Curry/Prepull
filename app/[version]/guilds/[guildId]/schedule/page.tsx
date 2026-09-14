import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../../../components/version-shell";
import { isContentVersion } from "../../../../../lib/game-data";
import { parseCalendarRegion } from "../../../../../lib/calendar/service";
import { requireUser } from "../../../../../lib/guilds/auth";
import {
  getGuildSchedule,
  type GuildScheduleEntry,
} from "../../../../../lib/guilds/schedule";
import { describeRelativeGuildDate } from "../../../../../lib/guilds/time";
import type { ContentVersion } from "../../../../../lib/types";

function ScheduleEntryCard({
  entry,
  version,
  guildId,
}: {
  entry: GuildScheduleEntry;
  version: string;
  guildId: string;
}) {
  const href =
    entry.type === "raid"
      ? `/${version}/guilds/${guildId}/raids/${entry.linkedRaidId}`
      : `/${version}/guilds/${guildId}/prep/${entry.prepRunId}`;
  return (
    <li>
      <Link
        className="panel block rounded-2xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        href={href}
      >
        <div className="flex items-start gap-4">
          <time
            className="w-14 shrink-0 text-lg font-semibold tabular-nums"
            dateTime={entry.scheduledFor}
          >
            {entry.guildLocalTime}
          </time>
          <div>
            <h3 className="font-semibold">{entry.title}</h3>
            <p className="mt-1 text-xs capitalize text-[var(--muted)]">
              {entry.type === "raid" ? "Raid" : "Prep Run"} · {entry.status}
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default async function GuildSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ version: string; guildId: string }>;
  searchParams: Promise<{ region?: string | string[] }>;
}) {
  const resolved = await params;
  const region = parseCalendarRegion((await searchParams).region);
  if (!isContentVersion(resolved.version)) notFound();
  const user = await requireUser();
  let schedule;
  try {
    schedule = await getGuildSchedule(user.id, resolved.guildId);
  } catch {
    notFound();
  }
  const sections = new Map<string, GuildScheduleEntry[]>();
  for (const entry of schedule.entries) {
    const current = sections.get(entry.guildLocalDate) ?? [];
    current.push(entry);
    sections.set(entry.guildLocalDate, current);
  }

  return (
    <VersionShell version={resolved.version as ContentVersion}>
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <nav
          aria-label="Guild schedule navigation"
          className="flex flex-wrap gap-4 text-xs text-[var(--muted)]"
        >
          <Link href={`/${resolved.version}/guilds/${resolved.guildId}`}>
            ← Guild workspace
          </Link>
          <Link href={`/${resolved.version}/guilds/${resolved.guildId}/calendar?region=${region}`}>
            Calendar
          </Link>
          <Link href={`/${resolved.version}/guilds/${resolved.guildId}/raids`}>
            Raids
          </Link>
          <Link href={`/${resolved.version}/guilds/${resolved.guildId}/prep`}>
            Prep Runs
          </Link>
          <Link
            href={`/${resolved.version}/guilds/${resolved.guildId}/settings`}
          >
            Settings
          </Link>
        </nav>
        <header className="mt-8">
          <p className="eyebrow">{schedule.guildName}</p>
          <h1 className="display mt-2 text-4xl">Guild Schedule</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            All times use the guild timezone:{" "}
            <strong>{schedule.timeZone}</strong>
          </p>
        </header>

        <section aria-labelledby="upcoming-activity-heading" className="mt-9">
          <h2 id="upcoming-activity-heading" className="sr-only">
            Upcoming activity
          </h2>
          {sections.size ? (
            <div className="grid gap-8">
              {[...sections].map(([localDate, entries]) => (
                <section aria-labelledby={`date-${localDate}`} key={localDate}>
                  <h2
                    className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]"
                    id={`date-${localDate}`}
                  >
                    {describeRelativeGuildDate(
                      entries[0].scheduledFor,
                      schedule.timeZone,
                    )}
                  </h2>
                  <ul className="mt-3 grid gap-3">
                    {entries.map((entry) => (
                      <ScheduleEntryCard
                        entry={entry}
                        version={resolved.version}
                        guildId={resolved.guildId}
                        key={`${entry.type}-${entry.id}`}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p className="panel rounded-2xl p-5 text-sm text-[var(--muted)]">
              No upcoming scheduled guild activity.
            </p>
          )}
        </section>

        {schedule.unscheduled.length ? (
          <section aria-labelledby="unscheduled-heading" className="mt-10">
            <h2 id="unscheduled-heading" className="display text-3xl">
              Unscheduled Prep Runs
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {schedule.unscheduled.map((run) => (
                <li className="panel rounded-2xl p-5" key={run.id}>
                  <h3 className="font-semibold">{run.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    For {run.raidName} · Time not set
                  </p>
                  <Link
                    className="button-secondary mt-4 inline-flex"
                    href={`/${resolved.version}/guilds/${resolved.guildId}/prep/${run.id}`}
                  >
                    View Prep Run
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </VersionShell>
  );
}
