import type { PublicLookupInput } from "../public-character/path.ts";
import { logsIdentity, verifiedLogsContext } from "./identity.ts";
import { ERA_PARTITION, ERA_RAIDS } from "./registry.ts";
import { emptyLogs, projectLogs, type LogsSummary, type LogsRaid } from "./model.ts";
import { warcraftLogsTransport, WclTransportError, type GraphqlResult } from "./transport.ts";

const object = (v: unknown): Record<string, unknown> | undefined => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : undefined;
const list = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const character = (r: GraphqlResult) => object(object(r.data?.characterData)?.character);
const roles = [{ role: "DPS", metric: "dps" }, { role: "Healer", metric: "hps" }, { role: "Tank", metric: "dps" }] as const;
type Selection = { alias: string; zone: number; role: string; metric: string; spec?: string };
export const ERA_SELECTIONS: Selection[] = ERA_RAIDS.flatMap(z => roles.map(r => ({ alias: `z${z.id}${r.role}`, zone: z.id, ...r })));
export function rankingQuery(selections: Selection[]) {
  // All values originate in the registry or validated provider spec names, never URL fragments.
  return `query PrePullEraRankings($id:Int!) { characterData { character(id:$id) { hidden ${selections.map(s => `${s.alias}:zoneRankings(zoneID:${s.zone},partition:${ERA_PARTITION.id},metric:${s.metric},role:${s.role}${s.spec ? `,specName:${JSON.stringify(s.spec)}` : ""})`).join("\n")} } } }`;
}
function validRanking(raw: unknown, selection: Selection) {
  const value = object(raw);
  return value && !value.error && value.zone === selection.zone && value.partition === ERA_PARTITION.id && value.metric === selection.metric && Array.isArray(value.rankings) ? value : undefined;
}
function specs(value: Record<string, unknown>) {
  return [...new Set([...list(value.allStars).map(v => object(v)?.spec), ...list(value.rankings).flatMap(v => [object(v)?.spec, object(v)?.bestSpec])].filter((v): v is string => typeof v === "string" && /^[A-Za-z -]{1,60}$/.test(v)))];
}

/** Public client API only. Never fetches events, account data, or private reports. */
export class WarcraftLogsProvider {
  constructor(privateTransport: Pick<typeof warcraftLogsTransport, "query"> = warcraftLogsTransport) { this.transport = privateTransport; }
  private readonly transport: Pick<typeof warcraftLogsTransport, "query">;
  async lookup(input: PublicLookupInput): Promise<LogsSummary> {
    if (!verifiedLogsContext(input)) return emptyLogs("unsupported");
    const identity = logsIdentity(input);
    const resolved = await this.transport.query("vanilla", `query PrePullLogsCharacter($name:String!,$realm:String!,$region:String!) {
      characterData { character(name:$name,serverSlug:$realm,serverRegion:$region) { id canonicalID hidden recentReports(limit:5,page:1) { data { code visibility startTime zone { id name } } } } }
    }`, { name: identity.characterName, realm: identity.realm, region: identity.region.toUpperCase() });
    const c = character(resolved);
    if (!c) {
      if (resolved.errors.length) throw new WclTransportError("upstream");
      return emptyLogs("not-found");
    }
    if (c.hidden === true) return emptyLogs("hidden");
    if (c.hidden !== false || !Number.isSafeInteger(c.id)) throw new WclTransportError("upstream");
    const base = await this.transport.query("vanilla", rankingQuery(ERA_SELECTIONS), { id: c.id });
    const b = character(base);
    if (b?.hidden === true) return emptyLogs("hidden");
    if (!b || b.hidden !== false) throw new WclTransportError("upstream");
    // Resolve each observed spec using WCL's own spec filter. An all-spec kill
    // count must never be attributed to the bestSpec printed on that row.
    const extra: Selection[] = [];
    const discovered = new Map<string, string[]>();
    for (const s of ERA_SELECTIONS) {
      const raw = validRanking(b[s.alias], s);
      const names = raw ? specs(raw) : [];
      discovered.set(s.alias, names);
      if (names.length >= 1 && names.length <= 3) names.forEach((spec, index) => extra.push({ ...s, spec, alias: `${s.alias}s${index}` }));
    }
    const split = extra.length ? await this.transport.query("vanilla", rankingQuery(extra), { id: c.id }) : undefined;
    const splitCharacter = split ? character(split) : undefined;
    if (splitCharacter?.hidden === true) return emptyLogs("hidden");
    if (split && splitCharacter?.hidden !== false) throw new WclTransportError("upstream");
    const summary = emptyLogs("available");
    summary.reportsUnavailable = resolved.errors.length > 0;
    summary.reports = list(object(c.recentReports)?.data).filter(v => object(v)?.visibility === "public").slice(0, 5).flatMap(v => {
      const report = object(v)!; const zone = object(report.zone);
      if (!ERA_RAIDS.some(r => r.id === zone?.id) || typeof report.code !== "string" || !/^[A-Za-z0-9]{16}$/.test(report.code) || typeof report.startTime !== "number" || !Number.isFinite(new Date(report.startTime).getTime()) || typeof zone?.name !== "string") return [];
      return [{ code: report.code, zoneName: zone.name, startedAt: new Date(report.startTime).toISOString() }];
    });
    summary.raids = ERA_RAIDS.map(zone => {
      const raid: LogsRaid = { zoneId: zone.id, name: zone.name, order: zone.order, status: "available", bosses: zone.encounters.map(e => ({ encounterId: e.id, name: e.name, progression: e.progression, performances: [] })), aggregates: [] };
      for (const s of ERA_SELECTIONS.filter(s => s.zone === zone.id)) {
        if (base.errors.some(e => !e.path?.length || e.path.includes(s.alias) || e.path.length < 3)) { raid.status = "temporary-error"; continue; }
        const names = discovered.get(s.alias)!;
        const selected = names.length >= 1 ? extra.filter(e => e.zone === s.zone && e.role === s.role) : [s];
        if (names.length > 3) { raid.status = "temporary-error"; continue; }
        for (const selection of selected) {
          const result = selection.spec ? split : base;
          const raw = validRanking((selection.spec ? splitCharacter : b)?.[selection.alias], selection);
          const errored = result?.errors.some(e => !e.path?.length || e.path.includes(selection.alias) || e.path.length < 3);
          if (!raw || errored) { raid.status = "temporary-error"; continue; }
          const spec = selection.spec ?? names[0] ?? "All specs";
          for (const [field, label] of [["bestPerformanceAverage", "Best Performance Avg"], ["medianPerformanceAverage", "Median Performance Avg"]] as const) {
            if (typeof raw[field] === "number") raid.aggregates.push({ label, value: raw[field], spec, role: s.role, metric: s.metric.toUpperCase() });
          }
          for (const value of list(raw.rankings)) {
            const row = object(value); const boss = raid.bosses.find(e => e.encounterId === object(row?.encounter)?.id);
            if (!row || !boss || typeof row.totalKills !== "number" || !Number.isSafeInteger(row.totalKills) || row.totalKills <= 0) continue;
            boss.performances.push({ spec, role: s.role, metric: s.metric.toUpperCase(), kills: row.totalKills,
              ...(typeof row.rankPercent === "number" ? { best: row.rankPercent } : {}), ...(typeof row.medianPercent === "number" ? { median: row.medianPercent } : {}) });
          }
        }
      }
      return raid;
    });
    if (summary.raids.every(r => r.status === "temporary-error")) throw new WclTransportError("upstream");
    if (!summary.reports.length && summary.raids.every(r => r.status === "available" && r.bosses.every(b => !b.performances.length))) return emptyLogs("no-public-logs");
    return projectLogs(summary);
  }
}
export const warcraftLogsProvider = new WarcraftLogsProvider();
