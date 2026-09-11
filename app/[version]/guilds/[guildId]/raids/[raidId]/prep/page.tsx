import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../../../../../components/version-shell";
import { isContentVersion } from "../../../../../../../lib/game-data";
import { requireUser } from "../../../../../../../lib/guilds/auth";
import type { RaidPrepActivityGroup, RaidPrepSummary } from "../../../../../../../lib/guilds/prep-board-types";
import { getRaidPrepBoard } from "../../../../../../../lib/guilds/readiness-service";
import type { ContentVersion } from "../../../../../../../lib/types";

const categoryLabel = (category: RaidPrepActivityGroup["category"]) => ({
  dungeon: "Dungeon", quest: "Quest", crafted: "Crafted / profession", reputation: "Reputation",
  "raid-alternative": "Raid alternative", other: "Other",
})[category];

function ActivityGroup({ group }: { group: RaidPrepActivityGroup }) {
  const opportunityLabel = group.category === "raid-alternative"
    ? `raid alternative${group.opportunityCount === 1 ? "" : "s"}`
    : `realistic opportunit${group.opportunityCount === 1 ? "y" : "ies"}`;
  return <details className="panel group rounded-2xl p-5"><summary className="cursor-pointer list-none rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-[var(--muted)]">{categoryLabel(group.category)}</p><h3 className="mt-1 text-xl font-semibold">{group.label}</h3></div><span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs">View players</span></div><p className="mt-3 text-sm"><strong>{group.playerCount}</strong> selected player{group.playerCount === 1 ? "" : "s"} · <strong>{group.opportunityCount}</strong> {opportunityLabel}</p></summary><ul className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4">{group.players.map((player) => <li className="rounded-xl border border-[var(--line)] p-4" key={player.guildCharacterId}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{player.characterName}</p><p className="mt-1 text-xs text-[var(--muted)]">{player.specName} {player.className}{player.groupName ? ` · ${player.groupName}` : ""}{player.raidRole ? ` · ${player.raidRole}` : ""}</p></div><span className="text-sm">{player.opportunityCount} opportunit{player.opportunityCount === 1 ? "y" : "ies"}</span></div>{player.lastRefreshedAt ? <p className="mt-2 text-xs text-[var(--muted)]">Last refreshed {new Date(player.lastRefreshedAt).toLocaleString()}</p> : null}</li>)}</ul></details>;
}

function EmptyBoard({ summary }: { summary: RaidPrepSummary }) {
  let message = "No realistic preparation activities are currently identified for the selected roster.";
  if (!summary.selectedCount) message = "No characters are selected for this raid yet.";
  else if (!summary.sharingCount) message = "Nobody on the selected roster is currently sharing readiness.";
  else if (summary.needsRefreshCount === summary.sharingCount) message = "All shared selected characters need a character refresh before preparation opportunities are available.";
  else if (summary.unsupportedSpecCount === summary.sharingCount) message = "Recommendations are unavailable for all currently shared specializations.";
  else if (summary.supportedDataCount && summary.noStrongPreRaidOpportunitiesCount === summary.supportedDataCount) message = "No strong Pre-Raid opportunities are currently identified for supported selected characters.";
  return <p className="panel rounded-2xl p-5 text-sm text-[var(--muted)]">{message}</p>;
}

export default async function RaidPrepPage({ params }: { params: Promise<{ version: string; guildId: string; raidId: string }> }) {
  const resolved = await params;
  if (!isContentVersion(resolved.version)) notFound();
  const user = await requireUser();
  let board;
  try { board = await getRaidPrepBoard(user.id, resolved.guildId, resolved.raidId); } catch { notFound(); }
  const summary = board.summary;
  const summaryCards = [["Selected", summary.selectedCount], ["Sharing readiness", summary.sharingCount], ["Supported current data", summary.supportedDataCount], ["With realistic opportunities", summary.withRealisticOpportunitiesCount], ["Need refresh", summary.needsRefreshCount], ["Recommendations unavailable", summary.unsupportedSpecCount], ["Not sharing", summary.notSharingCount], ["No strong Pre-Raid opportunities", summary.noStrongPreRaidOpportunitiesCount]] as const;
  return <VersionShell version={resolved.version as ContentVersion}><main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
    <nav aria-label="Raid preparation navigation" className="flex flex-wrap gap-4 text-xs text-[var(--muted)]"><Link href={`/${resolved.version}/guilds/${resolved.guildId}/raids/${resolved.raidId}/readiness`}>← Back to Raid Readiness</Link><Link href={`/${resolved.version}/guilds/${resolved.guildId}/raids/${resolved.raidId}`}>Back to Raid</Link></nav>
    <header className="mt-8"><p className="eyebrow">Guild Prep Board · {board.raid.instance}</p><h1 className="display mt-2 text-4xl">{board.raid.name} prep</h1><p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">High-level planning from selected players who chose to share readiness. These opportunities are suggestions—not requirements, rankings, or a judgment about raid spots.</p></header>
    <section aria-labelledby="prep-summary-heading" className="mt-7"><h2 id="prep-summary-heading" className="text-xl font-semibold">Selected roster summary</h2><dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{summaryCards.map(([label, count]) => <div className="panel rounded-xl p-4" key={label}><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-1 text-2xl font-semibold">{count}</dd></div>)}</dl></section>
    <section aria-labelledby="activities-heading" className="mt-10"><h2 id="activities-heading" className="display text-3xl">Realistic preparation activities</h2><p className="mt-2 text-sm text-[var(--muted)]">Sorted by selected players helped, then opportunity count, then activity name.</p><div className="mt-5 grid gap-4">{board.activityGroups.length ? board.activityGroups.map((group) => <ActivityGroup group={group} key={group.key}/>) : <EmptyBoard summary={summary}/>}</div></section>
    {board.raidAlternativeGroups.length ? <section aria-labelledby="raid-alternatives-heading" className="mt-10"><h2 id="raid-alternatives-heading" className="display text-3xl">Raid alternatives</h2><p className="mt-2 text-sm text-[var(--muted)]">Shown separately from realistic Pre-Raid preparation.</p><div className="mt-5 grid gap-4">{board.raidAlternativeGroups.map((group) => <ActivityGroup group={group} key={group.key}/>)}</div></section> : null}
    <section aria-labelledby="states-heading" className="panel mt-10 rounded-2xl p-5"><h2 id="states-heading" className="text-xl font-semibold">Other selected states</h2><ul className="mt-4 grid gap-2 text-sm"><li>Needs character refresh: {summary.needsRefreshCount}</li><li>Recommendations unavailable for this specialization: {summary.unsupportedSpecCount}</li><li>No readiness shared: {summary.notSharingCount}</li><li>No strong Pre-Raid opportunities currently identified: {summary.noStrongPreRaidOpportunitiesCount}</li></ul></section>
    <details className="panel mt-6 rounded-2xl p-5"><summary className="cursor-pointer rounded-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">Bench excluded from selected totals ({board.benchCount})</summary><p className="mt-3 text-sm text-[var(--muted)]">Bench opportunities do not change selected-player activity or summary counts. The Prep Board never promotes or benches players automatically.</p></details>
  </main></VersionShell>;
}
