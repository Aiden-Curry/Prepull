// Display/cache contract, not a declaration of WCL's unaudited ranking JSON.
export type LogsStatus = "available" | "not-found" | "hidden" | "no-public-logs" | "unsupported" | "temporary-error";
export type LogsPerformance = {
  spec: string; role: string; metric: string;
  kills?: number; best?: number; median?: number; recent?: number; lastKillAt?: string;
};
export type LogsBoss = { encounterId: number; name: string; progression: boolean; performances: LogsPerformance[] };
export type LogsAggregate = { label: "Best Performance Avg" | "Median Performance Avg"; value: number; metric: string; spec: string; role: string };
export type LogsRaid = { zoneId: number; name: string; order: number; status: "available" | "temporary-error"; bosses: LogsBoss[]; aggregates: LogsAggregate[] };
export type LogsSummary = {
  source: "warcraft-logs"; status: LogsStatus; retrievedAt: string;
  fixture: boolean; raids: LogsRaid[];
  reports: { code: string; zoneName: string; startedAt: string }[];
  reportsUnavailable: boolean;
};
export type LogsView = { summary: LogsSummary; freshness: "fresh" | "stale" | "unavailable" };

export function emptyLogs(status: LogsStatus, now = new Date()): LogsSummary {
  return { source: "warcraft-logs", status, retrievedAt: now.toISOString(), fixture: false, raids: [], reports: [], reportsUnavailable: false };
}
export function progression(raid: LogsRaid) {
  const tracked = raid.bosses.filter(boss => boss.progression);
  const killed = new Set(tracked.filter(boss => boss.performances.some(performance => (performance.kills ?? 0) >= 1)).map(boss => boss.encounterId)).size;
  const total = new Set(tracked.map(boss => boss.encounterId)).size;
  return { killed, total, cleared: raid.status === "available" && total > 0 && killed === total };
}

// Whitelist and validate both cache writes and reads. Never persist raw JSON or
// arbitrary URL/error fields. Invalid percentiles are unavailable, not clamped.
export function projectLogs(value: unknown, invalid: (field: string) => void = () => {}): LogsSummary {
  const object = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Invalid Logs projection");
    return v as Record<string, unknown>;
  };
  const text = (v: unknown) => { if (typeof v !== "string" || !v.trim() || v.length > 160) throw new Error("Invalid Logs text"); return v; };
  const integer = (v: unknown) => { if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0) throw new Error("Invalid Logs number"); return v; };
  const date = (v: unknown) => { if (typeof v !== "string" || !Number.isFinite(Date.parse(v))) throw new Error("Invalid Logs date"); return new Date(v).toISOString(); };
  const array = (v: unknown, max: number) => { if (!Array.isArray(v) || v.length > max) throw new Error("Invalid Logs list"); return v; };
  const percentile = (v: unknown, field: string) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100) return v;
    invalid(field); return undefined;
  };
  const raw = object(value);
  if (raw.source !== "warcraft-logs" || typeof raw.fixture !== "boolean" || typeof raw.reportsUnavailable !== "boolean" ||
      !["available", "not-found", "hidden", "no-public-logs", "unsupported", "temporary-error"].includes(String(raw.status))) throw new Error("Invalid Logs status");
  const result = emptyLogs(raw.status as LogsStatus, new Date(date(raw.retrievedAt)));
  result.fixture = raw.fixture;
  // Visibility/negative states must never retain an earlier public payload.
  if (result.status !== "available") return result;
  result.reportsUnavailable = raw.reportsUnavailable;
  const zoneIds = new Set<number>();
  result.raids = array(raw.raids, 20).map(value => {
    const raid = object(value); const zoneId = integer(raid.zoneId);
    if (zoneIds.has(zoneId)) throw new Error("Duplicate Logs zone"); zoneIds.add(zoneId);
    if (raid.status !== "available" && raid.status !== "temporary-error") throw new Error("Invalid raid status");
    const encounterIds = new Set<number>();
    const bosses = array(raid.bosses, 50).map(value => {
      const boss = object(value); const encounterId = integer(boss.encounterId);
      if (encounterIds.has(encounterId) || typeof boss.progression !== "boolean") throw new Error("Invalid Logs encounter"); encounterIds.add(encounterId);
      return { encounterId, name: text(boss.name), progression: boss.progression, performances: array(boss.performances, 20).map(value => {
        const p = object(value);
        return { spec: text(p.spec), role: text(p.role), metric: text(p.metric),
          ...(p.kills === undefined ? {} : { kills: integer(p.kills) }),
          best: percentile(p.best, "best"), median: percentile(p.median, "median"), recent: percentile(p.recent, "recent"),
          ...(p.lastKillAt === undefined ? {} : { lastKillAt: date(p.lastKillAt) }),
        };
      }) };
    });
    const aggregates: LogsAggregate[] = array(raid.aggregates, 20).flatMap(value => {
      const aggregate = object(value);
      if (aggregate.label !== "Best Performance Avg" && aggregate.label !== "Median Performance Avg") throw new Error("Invalid aggregate semantics");
      const valuePercentile = percentile(aggregate.value, "aggregate");
      return valuePercentile === undefined ? [] : [{ label: aggregate.label, value: valuePercentile, spec: text(aggregate.spec), role: text(aggregate.role), metric: text(aggregate.metric) }];
    });
    return { zoneId, name: text(raid.name), order: integer(raid.order), status: raid.status, bosses, aggregates };
  });
  result.reports = array(raw.reports, 5).map(value => {
    const report = object(value); const code = text(report.code);
    if (!/^[a-zA-Z0-9]{16}$/.test(code)) throw new Error("Invalid public report code");
    return { code, zoneName: text(report.zoneName), startedAt: date(report.startedAt) };
  });
  return result;
}
