import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../../../components/version-shell";
import { isContentVersion } from "../../../../../lib/game-data";
import { requireUser } from "../../../../../lib/guilds/auth";
import { prepRunService } from "../../../../../lib/guilds/prep-run-service";
import type { PrepRunRecord } from "../../../../../lib/guilds/prep-run-types";
import type { ContentVersion } from "../../../../../lib/types";

function RunCard({ run, version }: { run: PrepRunRecord; version: string }) {
  return <article className="panel rounded-2xl p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{run.raidName} preparation</p><h2 className="mt-2 text-xl font-semibold">{run.activityLabel}</h2></div><span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs capitalize">{run.status}</span></div><p className="mt-3 text-sm text-[var(--muted)]">{run.scheduledFor ? new Date(run.scheduledFor).toLocaleString() : "No time set"} · Organized by {run.organizerName}</p><p className="mt-2 text-sm">{run.goingCount} going · {run.maybeCount} maybe</p><Link className="button-secondary mt-4 inline-flex" href={`/${version}/guilds/${run.guildId}/prep/${run.id}`}>View Prep Run</Link></article>;
}

export default async function GuildPrepRunsPage({ params, searchParams }: { params: Promise<{ version: string; guildId: string }>; searchParams: Promise<{ prepError?: string }> }) {
  const resolved = await params;
  if (!isContentVersion(resolved.version)) notFound();
  const user = await requireUser();
  let runs;
  try { runs = await prepRunService.list(user.id, resolved.guildId); } catch { notFound(); }
  const query = await searchParams;
  const open = runs.filter((run) => run.status === "open"), history = runs.filter((run) => run.status !== "open");
  return <VersionShell version={resolved.version as ContentVersion}><main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
    <nav aria-label="Guild preparation navigation" className="flex flex-wrap gap-4 text-xs text-[var(--muted)]"><Link href={`/${resolved.version}/guilds/${resolved.guildId}`}>← Guild workspace</Link><Link href={`/${resolved.version}/guilds/${resolved.guildId}/raids`}>Raids</Link></nav>
    <header className="mt-8"><p className="eyebrow">Optional guild coordination</p><h1 className="display mt-2 text-4xl">Prep Runs</h1><p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">Guild activities created from raid Prep Board opportunities. Participation is always voluntary.</p></header>
    {query.prepError ? <p role="alert" className="mt-5 rounded-xl border border-red-300/30 bg-red-300/5 p-4 text-sm">{query.prepError}</p> : null}
    <section aria-labelledby="upcoming-heading" className="mt-9"><h2 id="upcoming-heading" className="display text-3xl">Upcoming Prep Runs</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{open.length ? open.map((run) => <RunCard run={run} version={resolved.version} key={run.id}/>) : <p className="panel rounded-2xl p-5 text-sm text-[var(--muted)] sm:col-span-2">No open Prep Runs yet. Raid organizers can create one from a realistic Prep Board activity.</p>}</div></section>
    {history.length ? <section aria-labelledby="history-heading" className="mt-10"><h2 id="history-heading" className="text-xl font-semibold">Completed and cancelled</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{history.map((run) => <RunCard run={run} version={resolved.version} key={run.id}/>)}</div></section> : null}
  </main></VersionShell>;
}
