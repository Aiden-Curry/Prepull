import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../../../../../components/version-shell";
import { isContentVersion } from "../../../../../../../lib/game-data";
import { requireUser } from "../../../../../../../lib/guilds/auth";
import { getRaidReadiness } from "../../../../../../../lib/guilds/readiness-service";
import type { GuildCharacterReadiness } from "../../../../../../../lib/guilds/readiness-types";
import type { ContentVersion } from "../../../../../../../lib/types";

const statusLabel = (row: GuildCharacterReadiness) => row.dataState === "available" ? "Shared readiness" : row.dataState === "needs-refresh" ? "Shared · needs refresh" : row.dataState === "unsupported-spec" ? "Shared · recommendations unavailable" : row.shareState === "unavailable" ? "Unavailable" : "Not shared";

function ReadinessCard({ row }: { row: GuildCharacterReadiness }) {
  return <article className="rounded-xl border border-[var(--line)] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-lg font-semibold">{row.characterName}</h3><p className="mt-1 text-sm text-[var(--muted)]">{row.specName} {row.className}{row.groupName ? ` · ${row.groupName}` : ""}{row.raidRole ? ` · ${row.raidRole}` : ""}</p>{row.mainName ? <p className="mt-1 text-xs text-[var(--muted)]">Alt of {row.mainName}</p> : null}</div><span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs">{statusLabel(row)}</span></div>{row.lastRefreshedAt ? <p className="mt-3 text-xs text-[var(--muted)]">Last refreshed {new Date(row.lastRefreshedAt).toLocaleString()}</p> : null}{row.summary ? <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs text-[var(--muted)]">Evaluated slots</dt><dd className="font-semibold">{row.summary.evaluatedSlots}</dd></div><div><dt className="text-xs text-[var(--muted)]">Opportunities</dt><dd className="font-semibold">{row.summary.actionableUpgradeCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Reference phases</dt><dd className="font-semibold">{row.recommendationSupport?.supportedPhases?.join(", ") || "Unavailable"}</dd></div></dl> : null}<p className="mt-3 text-sm">{row.message}</p>{row.activityCategoryCounts && Object.keys(row.activityCategoryCounts).length ? <div className="mt-3"><h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Broad opportunity sources</h4><ul className="mt-2 flex flex-wrap gap-2 text-xs">{Object.entries(row.activityCategoryCounts).map(([category, count]) => <li className="rounded-full bg-white/[0.05] px-3 py-1 capitalize" key={category}>{category}: {count}</li>)}</ul></div> : null}</article>;
}

export default async function RaidReadinessPage({ params }: { params: Promise<{ version: string; guildId: string; raidId: string }> }) {
  const resolved = await params;
  if (!isContentVersion(resolved.version)) notFound();
  const user = await requireUser();
  let data;
  try { data = await getRaidReadiness(user.id, resolved.guildId, resolved.raidId); } catch { notFound(); }
  const summary = data.summary;
  return <VersionShell version={resolved.version as ContentVersion}><main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
    <Link href={`/${resolved.version}/guilds/${resolved.guildId}/raids/${resolved.raidId}`} className="text-xs text-[var(--muted)]">← Raid details</Link>
    <header className="mt-8"><p className="eyebrow">Raid readiness · {data.raid.instance}</p><h1 className="display mt-2 text-4xl">{data.raid.name}</h1><p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">Player-controlled, high-level readiness information. Opportunities are suggestions, not requirements or a judgment of raid readiness.</p><Link href={`/${resolved.version}/guilds/${resolved.guildId}/raids/${resolved.raidId}/prep`} className="button-primary mt-5 inline-flex">View Prep Board</Link></header>
    <section aria-labelledby="readiness-summary-heading" className="panel mt-6 rounded-2xl p-5"><h2 id="readiness-summary-heading" className="text-xl font-semibold">Selected roster summary</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6"><div><dt className="text-xs text-[var(--muted)]">Selected</dt><dd className="text-2xl font-semibold">{summary.selectedCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Sharing</dt><dd className="text-2xl font-semibold">{summary.sharingCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Supported specs</dt><dd className="text-2xl font-semibold">{summary.supportedCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Need refresh</dt><dd className="text-2xl font-semibold">{summary.needsRefreshCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Unsupported specs</dt><dd className="text-2xl font-semibold">{summary.unsupportedCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Not sharing</dt><dd className="text-2xl font-semibold">{summary.notSharingCount}</dd></div></dl></section>
    <section aria-labelledby="selected-readiness-heading" className="mt-8"><h2 id="selected-readiness-heading" className="display text-3xl">Selected characters</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{data.selected.map((row) => <ReadinessCard key={row.guildCharacterId} row={row}/>)}</div></section>
    <section aria-labelledby="bench-readiness-heading" className="mt-10"><h2 id="bench-readiness-heading" className="display text-3xl">Bench</h2><p className="mt-2 text-sm text-[var(--muted)]">Bench information is separate from selected-roster totals.</p><div className="mt-4 grid gap-4 lg:grid-cols-2">{data.bench.length ? data.bench.map((row) => <ReadinessCard key={row.guildCharacterId} row={row}/>) : <p className="text-sm text-[var(--muted)]">No bench characters.</p>}</div></section>
  </main></VersionShell>;
}
