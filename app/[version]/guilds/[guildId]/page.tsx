import Link from "next/link";
import { notFound } from "next/navigation";
import { GuildDateTimeFields } from "../../../../components/guild-date-time-fields";
import { VersionShell } from "../../../../components/version-shell";
import { isGameVersion } from "../../../../lib/game-data";
import { getCalendarEvents } from "../../../../lib/calendar/registry";
import { currentCalendarNow, parseCalendarRegion } from "../../../../lib/calendar/service";
import { buildUnifiedCalendarProjection, selectUnifiedDashboardEntries, type UnifiedCalendarEntry } from "../../../../lib/calendar/unified";
import { requireUser } from "../../../../lib/guilds/auth";
import { getGuildRepository } from "../../../../lib/guilds/factory";
import { getGuildSchedule } from "../../../../lib/guilds/schedule";
import { formatGuildScheduleTime } from "../../../../lib/guilds/time";
import {
  addMemberAction,
  createRaidAction,
  selectRosterAction,
  signupAction,
} from "../../../../lib/guilds/actions";
import type { ContentVersion } from "../../../../lib/types";

export default async function GuildWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ version: string; guildId: string }>;
  searchParams: Promise<{ raidError?: string; region?: string | string[] }>;
}) {
  const resolvedParams = await params;
  if (!isGameVersion(resolvedParams.version)) notFound();
  const version = resolvedParams.version as ContentVersion;
  const query = await searchParams;
  const gameRegion = parseCalendarRegion(query.region);
  const now = currentCalendarNow();
  const user = await requireUser();
  let workspace, schedule;
  try {
    [workspace, schedule] = await Promise.all([
      getGuildRepository().getWorkspace(user.id, resolvedParams.guildId),
      getGuildSchedule(user.id, resolvedParams.guildId, now),
    ]);
  } catch {
    notFound();
  }
  const { guild, roster, events } = workspace;
  const unified = buildUnifiedCalendarProjection({ version, region: gameRegion, gameEvents: getCalendarEvents(version), schedule, now });
  const upNext = selectUnifiedDashboardEntries(unified);
  const readiness = {
    ready: roster.filter((member) => member.readiness === "ready").length,
    review: roster.filter((member) => member.readiness === "needs-review")
      .length,
    unknown: roster.filter((member) => member.readiness === "unknown").length,
  };
  return (
    <VersionShell version={version}>
      <main className="mx-auto min-h-[calc(100vh-148px)] max-w-[1240px] px-5 py-12 lg:px-8">
        <Link
          href={`/${version}/guilds`}
          className="text-xs text-[var(--muted)]"
        >
          Ã¢â€ Â All guilds
        </Link>
        <nav
          className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--muted)]"
          aria-label="Guild workspace navigation"
        >
          <Link href={`/${version}/guilds/${guild.id}/calendar?region=${gameRegion}`}>Calendar</Link>
          <Link href={`/${version}/guilds/${guild.id}/schedule`}>Schedule</Link>
          <Link href={`/${version}/guilds/${guild.id}/raids`}>Raids</Link>
          <Link href={`/${version}/guilds/${guild.id}/prep`}>Prep Runs</Link>
          <Link href={`/${version}/guilds/${guild.id}/settings`}>Settings</Link>
        </nav>
        {query.raidError ? (
          <p
            className="mt-5 rounded-xl border border-red-300/30 bg-red-300/5 p-4 text-sm"
            role="alert"
          >
            {query.raidError}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {guild.realmName} Ã‚Â· {guild.faction} Ã‚Â·{" "}
              {guild.contentVersion.toUpperCase()}
            </p>
            <h1 className="display mt-2 text-4xl">{guild.name}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {guild.description || "Guild workspace"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-right">
            <p className="eyebrow">RosterReady</p>
            <p className="mt-1 text-2xl font-semibold">
              {readiness.ready}/{roster.length}
            </p>
            <p className="text-xs text-[var(--muted)]">
              ready Ã‚Â· {readiness.review} review Ã‚Â· {readiness.unknown}{" "}
              unknown
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-6">
            <div className="panel rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">RosterReady</p>
                  <h2 className="mt-2 text-2xl font-semibold">Guild roster</h2>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {roster.length} characters
                </span>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-[var(--muted)]">
                    <tr>
                      <th className="pb-3">Character</th>
                      <th className="pb-3">Class / spec</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((member) => (
                      <tr
                        key={member.id}
                        className="border-t border-[var(--line)]"
                      >
                        <td className="py-3">
                          <strong>{member.characterName}</strong>
                          <span className="block text-xs text-[var(--muted)]">
                            {member.race} Ã‚Â· {member.realm}
                          </span>
                        </td>
                        <td className="py-3">
                          {member.className}
                          <span className="block text-xs text-[var(--muted)]">
                            {member.spec}
                          </span>
                        </td>
                        <td className="py-3">{member.role}</td>
                        <td className="py-3">{member.readiness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form
                action={addMemberAction}
                className="mt-6 grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-3"
              >
                <input type="hidden" name="guildId" value={guild.id} />
                <Field name="characterName" label="Name" required />
                <Field name="characterId" label="Character ID" required />
                <Field name="className" label="Class" required />
                <Field name="spec" label="Spec" />
                <Field name="race" label="Race" />
                <Field name="realm" label="Realm" value={guild.realmName} />
                <Select
                  name="role"
                  label="Role"
                  options={["DPS", "Healer", "Tank", "Flex"]}
                />
                <Select
                  name="readiness"
                  label="Readiness"
                  options={["ready", "needs-review", "unknown"]}
                />
                <input type="hidden" name="level" value="60" />
                <input type="hidden" name="faction" value={guild.faction} />
                <input type="hidden" name="region" value={guild.region} />
                <input
                  type="hidden"
                  name="realmType"
                  value={guild.characterRealmType}
                />
                <input
                  type="hidden"
                  name="contentVersion"
                  value={guild.contentVersion}
                />
                <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--background)] sm:col-span-3">
                  Add roster character
                </button>
              </form>
            </div>
            <div className="panel rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">RaidBoard</p>
                  <h2 className="mt-2 text-2xl font-semibold">Raid events</h2>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {events.length} event{events.length === 1 ? "" : "s"}
                </span>
              </div>
              {events.map((raid) => (
                <div
                  key={raid.id}
                  className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--background)] p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <h3 className="font-semibold">
                      {raid.name}
                      <span className="hidden" aria-hidden="true">
                        {raid.instance} Ã‚Â· {raid.startsAt}
                      </span>
                      <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                        {raid.instance} ·{" "}
                        {formatGuildScheduleTime(
                          raid.startsAt,
                          guild.raidTimezone ?? "UTC",
                        )}{" "}
                        ({guild.raidTimezone})
                      </span>
                    </h3>
                    <span className="text-xs text-[var(--primary-light)]">
                      {raid.selectedCharacterIds.length} selected /{" "}
                      {raid.signups.length} signups
                    </span>
                  </div>
                  <form action={selectRosterAction} className="mt-4 space-y-3">
                    <input type="hidden" name="guildId" value={guild.id} />
                    <input type="hidden" name="eventId" value={raid.id} />
                    {roster.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="characterId"
                          value={member.id}
                          defaultChecked={raid.selectedCharacterIds.includes(
                            member.id,
                          )}
                        />
                        {member.characterName}
                        <span className="text-xs text-[var(--muted)]">
                          {member.role}
                        </span>
                      </label>
                    ))}
                    <button className="rounded-lg border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary-light)]">
                      Save selected roster
                    </button>
                  </form>
                  <form
                    action={signupAction}
                    className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-3"
                  >
                    <input type="hidden" name="guildId" value={guild.id} />
                    <input type="hidden" name="eventId" value={raid.id} />
                    <Select
                      name="characterId"
                      label="Character"
                      options={roster.map((member) => member.id)}
                    />
                    <Select
                      name="status"
                      label="Signup"
                      options={["confirmed", "pending", "waitlist", "declined"]}
                    />
                    <button className="self-end rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs font-bold text-[var(--primary-light)]">
                      Save signup
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
          <aside className="space-y-6">
            <section
              className="panel rounded-2xl p-6"
              aria-labelledby="up-next-heading"
            >
              <p className="eyebrow">Schedule</p>
              <h2 id="up-next-heading" className="mt-2 text-xl font-semibold">
                Up next
              </h2>
              {upNext.length ? (
                <ul className="mt-4 grid gap-3">
                  {upNext.map((entry) => (
                    <li key={`${entry.kind}-${entry.id}`}>
                      <Link
                        className="block rounded-lg border border-[var(--line)] p-3"
                        href={entry.kind === "game-event" ? `/${version}/calendar?region=${gameRegion}` : entry.href}
                      >
                        <span className="origin-badge">{entry.kind === "game-event" ? "Game" : entry.kind === "raid" ? "Raid" : "Prep"}</span>
                        <p className="mt-1 font-semibold">{entry.title}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{dashboardCalendarLabel(entry)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  No upcoming scheduled activity.
                </p>
              )}
              <Link
                className="button-secondary mt-4 inline-flex"
                href={`/${version}/guilds/${guild.id}/calendar?region=${gameRegion}`}
              >
                View Calendar
              </Link>
            </section>
            <form action={createRaidAction} className="panel rounded-2xl p-6">
              <p className="eyebrow">RaidBoard</p>
              <h2 className="mt-2 text-xl font-semibold">Create raid event</h2>
              <input type="hidden" name="guildId" value={guild.id} />
              <input type="hidden" name="version" value={version} />
              <div className="mt-4 grid gap-3">
                <Field name="name" label="Event name" required />
                <Field name="instance" label="Instance" required />
                <GuildDateTimeFields timeZone={guild.raidTimezone ?? "UTC"} />
                <Field
                  name="durationMinutes"
                  label="Duration minutes"
                  value="180"
                  required
                />
              </div>
              <button className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--background)]">
                Create event
              </button>
            </form>
          </aside>
        </div>
      </main>
    </VersionShell>
  );
}
function dashboardCalendarLabel(entry: UnifiedCalendarEntry) {
  if (entry.kind !== "game-event") return `${entry.guildLocalDate} · ${entry.guildLocalTime}`;
  if (entry.timing.kind === "instant-range") return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(entry.timing.startsAt));
  return entry.timing.endsOn ? `${entry.timing.startsOn} – ${entry.timing.endsOn}` : entry.timing.startsOn;
}
function Field({
  name,
  label,
  required,
  value,
}: {
  name: string;
  label: string;
  required?: boolean;
  value?: string;
}) {
  return (
    <label className="block text-xs text-[var(--muted)]">
      {label}
      <input
        name={name}
        defaultValue={value}
        required={required}
        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text)]"
      />
    </label>
  );
}
function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <label className="block text-xs text-[var(--muted)]">
      {label}
      <select
        name={name}
        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text)]"
      >
        {options.length ? (
          options.map((option) => <option key={option}>{option}</option>)
        ) : (
          <option>No characters</option>
        )}
      </select>
    </label>
  );
}
