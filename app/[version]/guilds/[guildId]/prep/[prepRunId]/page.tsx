import Link from "next/link";
import { notFound } from "next/navigation";
import { GuildDateTimeFields } from "../../../../../../components/guild-date-time-fields";
import { VersionShell } from "../../../../../../components/version-shell";
import { isContentVersion } from "../../../../../../lib/game-data";
import { requireUser } from "../../../../../../lib/guilds/auth";
import {
  setMyPrepRunSignupAction,
  setPrepRunStatusAction,
  updatePrepRunAction,
} from "../../../../../../lib/guilds/prep-run-actions";
import { prepRunService } from "../../../../../../lib/guilds/prep-run-service";
import {
  formatGuildScheduleTime,
  instantToGuildLocalInput,
} from "../../../../../../lib/guilds/time";
import type { ContentVersion } from "../../../../../../lib/types";

export default async function PrepRunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ version: string; guildId: string; prepRunId: string }>;
  searchParams: Promise<{ prepError?: string; prepNotice?: string }>;
}) {
  const resolved = await params;
  if (!isContentVersion(resolved.version)) notFound();
  const user = await requireUser();
  let run;
  try {
    run = await prepRunService.detail(
      user.id,
      resolved.guildId,
      resolved.prepRunId,
    );
  } catch {
    notFound();
  }
  const query = await searchParams;
  const scheduleDefaults = run.scheduledFor
    ? instantToGuildLocalInput(run.scheduledFor, run.guildTimeZone)
    : undefined;
  const going = run.participants.filter(
      (participant) => participant.status === "going",
    ),
    maybe = run.participants.filter(
      (participant) => participant.status === "maybe",
    );
  const hidden = (
    <>
      <input type="hidden" name="version" value={resolved.version} />
      <input type="hidden" name="guildId" value={resolved.guildId} />
      <input type="hidden" name="runId" value={run.id} />
    </>
  );
  return (
    <VersionShell version={resolved.version as ContentVersion}>
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <nav
          aria-label="Prep Run navigation"
          className="flex flex-wrap gap-4 text-xs text-[var(--muted)]"
        >
          <Link href={`/${resolved.version}/guilds/${resolved.guildId}/prep`}>
            ← All Prep Runs
          </Link>
          <Link
            href={`/${resolved.version}/guilds/${resolved.guildId}/raids/${run.raidId}`}
          >
            Linked raid
          </Link>
          {run.canManage ? (
            <Link
              href={`/${resolved.version}/guilds/${resolved.guildId}/raids/${run.raidId}/prep`}
            >
              Prep Board
            </Link>
          ) : null}
          <Link
            href={`/${resolved.version}/guilds/${resolved.guildId}/schedule`}
          >
            Schedule
          </Link>
        </nav>
        <header className="mt-8">
          <p className="eyebrow">
            {run.raidName} preparation ·{" "}
            {run.activityCategory.replaceAll("-", " ")}
          </p>
          <h1 className="display mt-2 text-4xl">
            {run.activityLabel} Prep Run
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {run.scheduledFor
              ? `${formatGuildScheduleTime(run.scheduledFor, run.guildTimeZone)} (${run.guildTimeZone})`
              : "No time set"}{" "}
            · Organized by {run.organizerName}
          </p>
          <p className="mt-3 max-w-2xl text-sm">
            {run.note || "Optional guild preparation run."}
          </p>
          <p className="mt-3 text-sm capitalize">
            Status: <strong>{run.status}</strong>
          </p>
        </header>
        {query.prepError ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-300/30 bg-red-300/5 p-4 text-sm"
          >
            {query.prepError}
          </p>
        ) : null}
        {query.prepNotice ? (
          <p
            role="status"
            className="mt-5 rounded-xl border border-[var(--line)] p-4 text-sm"
          >
            {query.prepNotice}
          </p>
        ) : null}
        {run.myCharacterMayBenefit ? (
          <p className="mt-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 text-sm">
            This activity currently has useful opportunities for your shared
            character.
          </p>
        ) : null}
        <section
          aria-labelledby="my-response-heading"
          className="panel mt-6 rounded-2xl p-5"
        >
          <h2 id="my-response-heading" className="text-xl font-semibold">
            My response
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Current response:{" "}
            <strong className="capitalize text-[var(--foreground)]">
              {run.mySignup ?? "Not responded"}
            </strong>
          </p>
          {run.status === "open" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {(["going", "maybe", "leave"] as const).map((status) => (
                <form action={setMyPrepRunSignupAction} key={status}>
                  {hidden}
                  <input type="hidden" name="status" value={status} />
                  <button
                    className={
                      status === run.mySignup
                        ? "button-primary"
                        : "button-secondary"
                    }
                    type="submit"
                  >
                    {status === "leave"
                      ? "Leave"
                      : status === "going"
                        ? "Going"
                        : "Maybe"}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm">Signup changes are closed.</p>
          )}
        </section>
        <section aria-labelledby="participants-heading" className="mt-8">
          <h2 id="participants-heading" className="display text-3xl">
            Participants
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ParticipantGroup title="Going" participants={going} />
            <ParticipantGroup title="Maybe" participants={maybe} />
          </div>
        </section>
        {run.canManage ? (
          <section
            aria-labelledby="organizer-heading"
            className="panel mt-8 rounded-2xl p-5"
          >
            <h2 id="organizer-heading" className="text-xl font-semibold">
              Organizer controls
            </h2>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-[var(--muted)]">May benefit</dt>
                <dd className="text-xl font-semibold">{run.mayBenefitCount}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Going</dt>
                <dd className="text-xl font-semibold">{going.length}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Not responded</dt>
                <dd className="text-xl font-semibold">
                  {run.notRespondedCount}
                </dd>
              </div>
            </dl>
            <details className="mt-4">
              <summary className="cursor-pointer rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
                View characters who may benefit
              </summary>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {run.mayBenefitCharacters?.join(", ") ||
                  "No shared selected characters currently match this activity."}
              </p>
            </details>
            {run.status === "open" ? (
              <>
                <form
                  action={updatePrepRunAction}
                  className="mt-6 grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-2"
                >
                  {hidden}
                  <GuildDateTimeFields
                    timeZone={run.guildTimeZone}
                    optional
                    defaultDate={scheduleDefaults?.localDate}
                    defaultTime={scheduleDefaults?.localTime}
                    defaultOffset={scheduleDefaults?.offset}
                  />
                  <label className="text-sm">
                    Note
                    <input
                      className="field mt-1 w-full"
                      name="note"
                      maxLength={280}
                      defaultValue={run.note}
                    />
                  </label>
                  <button
                    className="button-secondary sm:col-span-2"
                    type="submit"
                  >
                    Save Prep Run
                  </button>
                </form>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(["completed", "cancelled"] as const).map((status) => (
                    <form action={setPrepRunStatusAction} key={status}>
                      {hidden}
                      <input type="hidden" name="status" value={status} />
                      <button className="button-secondary" type="submit">
                        {status === "completed"
                          ? "Mark complete"
                          : "Cancel Prep Run"}
                      </button>
                    </form>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}
      </main>
    </VersionShell>
  );
}

function ParticipantGroup({
  title,
  participants,
}: {
  title: string;
  participants: { membershipId: string; displayName: string }[];
}) {
  return (
    <section className="panel rounded-2xl p-5">
      <h3 className="text-lg font-semibold">
        {title} ({participants.length})
      </h3>
      {participants.length ? (
        <ul className="mt-3 grid gap-2 text-sm">
          {participants.map((participant) => (
            <li key={participant.membershipId}>{participant.displayName}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">Nobody yet.</p>
      )}
    </section>
  );
}
