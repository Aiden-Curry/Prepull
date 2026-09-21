import type { LogsView, LogsPerformance } from "../lib/warcraft-logs/model";
import Link from "next/link";
import { bossGuide, guideHref, raidGuide } from "../lib/guides/registry";
import { progression } from "../lib/warcraft-logs/model";
import { WCL_SITES, WCL_HOME, type WarcraftLogsSiteContext } from "../lib/warcraft-logs/context";
import { logsReportUrl, isLogsCharacterUrl } from "../lib/warcraft-logs/identity";

const messages = {
  "not-found": "No Warcraft Logs character was found for this realm and name.",
  hidden: "Warcraft Logs rankings are hidden for this character.",
  "no-public-logs": "No public Warcraft Logs data found for this character.",
  unsupported: "Warcraft Logs is unavailable for this game context.",
  "temporary-error": "Warcraft Logs is temporarily unavailable. Character information remains available.",
} as const;
function percentile(value: number) { return value.toLocaleString("en-GB", { maximumFractionDigits: 1 }); }
function timestamp(value: string) { return new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }); }
const external = "focus-ring inline-flex min-h-11 items-center break-words underline underline-offset-4";

export function LogsLoading() {
  return <section id="character-logs" aria-labelledby="logs-heading" aria-busy="true" className="panel mt-6 min-h-48 rounded-3xl p-6"><h2 id="logs-heading" className="display text-3xl">Logs</h2><p role="status" className="mt-4">Loading public Warcraft Logs data…</p></section>;
}
export function CharacterLogs({ view, characterUrl, site }: { view: LogsView; characterUrl?: string; site?: WarcraftLogsSiteContext }) {
  const { summary } = view;
  const availableProgress = summary.raids.filter(raid => raid.status === "available").map(progression);
  const totals = availableProgress.reduce((total, raid) => ({ killed: total.killed + raid.killed, bosses: total.bosses + raid.total, cleared: total.cleared + Number(raid.cleared) }), { killed: 0, bosses: 0, cleared: 0 });
  const safeCharacterUrl = site && characterUrl && isLogsCharacterUrl(site, characterUrl) ? characterUrl : undefined;
  return <section id="character-logs" aria-labelledby="logs-heading" className="panel mt-6 min-w-0 rounded-3xl p-4 sm:p-7" data-logs-status={summary.status}>
    <header><h2 id="logs-heading" className="display text-3xl">Logs</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Public raid history and performance, separate from current Armory equipment and talents.</p>
      {summary.fixture && <p className="mt-3 font-semibold">Synthetic display fixture — not live Warcraft Logs data.</p>}
      {!summary.fixture && site === "vanilla" && summary.status === "available" && <p className="mt-3 text-sm">Classic Era · S0 · World buffs included</p>}
      {view.freshness === "stale" && <p className="mt-3" role="status">Showing previously retrieved data while Warcraft Logs is temporarily unavailable.</p>}
      {summary.status === "available" && <p className="mt-3 text-xs text-[var(--text-muted)]">Retrieved <time dateTime={summary.retrievedAt}>{timestamp(summary.retrievedAt)} UTC</time></p>}
    </header>
    {summary.status !== "available" ? <p className="mt-5" role="status">{messages[summary.status]}</p> : <>
      {availableProgress.length > 0 && <div className="mt-5"><p className="text-xs text-[var(--text-muted)]">Across available raids</p><dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3"><div><dt className="text-sm">Raids cleared</dt><dd className="text-xl font-semibold">{totals.cleared}</dd></div><div><dt className="text-sm">Bosses killed</dt><dd className="text-xl font-semibold">{totals.killed} / {totals.bosses}</dd></div></dl></div>}
      <div className="mt-6 space-y-4">{[...summary.raids].sort((a, b) => b.order - a.order).map((raid, index) => {
        const progress = progression(raid);
        return <details key={raid.zoneId} open={index === 0} className="rounded-2xl border border-[var(--border)] p-4">
          <summary className="focus-ring cursor-pointer rounded text-lg font-semibold"><span>{raid.name}</span><span className="mt-1 block text-sm font-normal">{raid.status === "temporary-error" ? "Raid data temporarily unavailable" : `${progress.killed} / ${progress.total} bosses killed${progress.cleared ? " · Cleared" : ""}`}</span></summary>
          {raid.status === "available" && <>
            {site === "vanilla" && <LogsGuideLink zoneId={raid.zoneId} />}
            {raid.bosses.every(boss => boss.performances.length === 0) && <p className="mt-4 text-sm">No public ranking data for this raid.</p>}
            {raid.aggregates.length > 0 && <dl className="mt-5 grid gap-4 sm:grid-cols-2">{raid.aggregates.map((aggregate, i) => <div key={i}><dt className="text-sm">{aggregate.label} · {aggregate.spec} · {aggregate.role} · {aggregate.metric}</dt><dd className="mt-1 text-xl font-semibold">{percentile(aggregate.value)}</dd></div>)}</dl>}
            <ul className="mt-5 space-y-3">{raid.bosses.map(boss => <li key={boss.encounterId} className="min-w-0 rounded-xl bg-white/[.03] p-4"><h3 className="break-words font-semibold">{boss.name}{!boss.progression && <span className="ml-2 text-xs font-normal">Optional encounter</span>}</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{boss.performances.some(p => (p.kills ?? 0) >= 1) ? "Public kill recorded" : "No public kill recorded"}</p>
              {site === "vanilla" && <LogsGuideLink zoneId={raid.zoneId} encounterId={boss.encounterId} />}
              {boss.performances.length ? boss.performances.map((performance, i) => <Performance key={i} performance={performance} />) : <p className="mt-2 text-sm text-[var(--text-muted)]">No public ranking data.</p>}
            </li>)}</ul>
          </>}
        </details>;
      })}</div>
      <section className="mt-7" aria-labelledby="recent-logs-heading"><h3 id="recent-logs-heading" className="text-xl font-semibold">Recent public raids</h3>
        {summary.reportsUnavailable && <p className="mt-3">Recent public reports are temporarily unavailable.</p>}
        {!summary.reports.length && !summary.reportsUnavailable && <p className="mt-3 text-sm text-[var(--text-muted)]">No recent public reports found.</p>}
        <ul className="mt-3 space-y-2">{summary.reports.map(report => <li key={report.code} className="flex flex-wrap items-center justify-between gap-x-4">
          {!summary.fixture && site && logsReportUrl(site, report.code) ? <a className={external} href={site ? logsReportUrl(site, report.code) : undefined} target="_blank" rel="noopener noreferrer">{report.zoneName}<span className="sr-only"> on Warcraft Logs (opens in a new tab)</span></a> : <span>{report.zoneName}</span>}
          <time className="text-sm text-[var(--text-muted)]" dateTime={report.startedAt}>{timestamp(report.startedAt)}</time>
        </li>)}</ul>
      </section>
    </>}
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-5 border-t border-[var(--border)] pt-3 text-sm">
      <a className={external} href={site ? WCL_SITES[site].site : WCL_HOME} target="_blank" rel="noopener noreferrer">Data from Warcraft Logs<span className="sr-only"> (opens in a new tab)</span></a>
      {safeCharacterUrl && !summary.fixture && <a className={external} href={safeCharacterUrl} target="_blank" rel="noopener noreferrer">View on Warcraft Logs<span className="sr-only"> (opens in a new tab)</span></a>}
    </footer>
  </section>;
}
function LogsGuideLink({ zoneId, encounterId }: { zoneId: number; encounterId?: number }) {
  const guide = encounterId === undefined ? raidGuide("era", zoneId) : bossGuide("era", zoneId, encounterId);
  return guide ? <Link className="focus-ring inline-flex min-h-11 items-center py-2 text-sm text-[var(--accent-hover)] underline underline-offset-4" href={guideHref(guide)}>{guide.title} guide</Link> : null;
}
function Performance({ performance: p }: { performance: LogsPerformance }) {
  return <div className="mt-3"><p className="break-words text-xs text-[var(--text-muted)]">{p.spec} · {p.role} · {p.metric}</p><dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
    <div><dt>Kills</dt><dd className="font-semibold">{p.kills ?? "Unavailable"}</dd></div>
    {p.best !== undefined && <div><dt>Best percentile</dt><dd className="font-semibold">{percentile(p.best)}</dd></div>}
    {p.median !== undefined && <div><dt>Median percentile</dt><dd className="font-semibold">{percentile(p.median)}</dd></div>}
    {p.recent !== undefined && <div><dt>Recent percentile</dt><dd className="font-semibold">{percentile(p.recent)}</dd></div>}
    {p.lastKillAt && <div><dt>Last kill</dt><dd><time dateTime={p.lastKillAt}>{timestamp(p.lastKillAt)}</time></dd></div>}
  </dl></div>;
}
