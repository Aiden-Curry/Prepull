import { query } from "../guilds/db.ts";
import { projectLogs, type LogsSummary } from "./model.ts";

export type LogsCacheEntry = { summary?: LogsSummary; freshUntil: number; staleUntil: number; retryAfter: number; staleAllowed: boolean };
export interface LogsCache {
  get(key: string): Promise<LogsCacheEntry | undefined>;
  acquire(key: string, owner: string, now: number): Promise<boolean>;
  save(key: string, owner: string, summary: LogsSummary, freshUntil: number, staleUntil: number, now: number): Promise<void>;
  fail(key: string, owner: string, retryAfter: number, staleAllowed: boolean, now: number): Promise<void>;
}
export class PostgresLogsCache implements LogsCache {
  async get(key: string): Promise<LogsCacheEntry | undefined> {
    const result = await query<{ projection: unknown; fresh_until: Date | null; stale_until: Date | null; retry_after: Date | null; stale_allowed: boolean }>(
      "SELECT projection, fresh_until, stale_until, retry_after, stale_allowed FROM warcraft_logs_cache WHERE cache_key=$1", [key]);
    const row = result.rows[0]; if (!row) return undefined;
    let summary: LogsSummary | undefined;
    try { summary = row.projection ? projectLogs(row.projection) : undefined; } catch { /* Corrupt cache is never served. */ }
    return { summary, freshUntil: row.fresh_until?.getTime() ?? 0, staleUntil: row.stale_until?.getTime() ?? 0,
      retryAfter: row.retry_after?.getTime() ?? 0, staleAllowed: row.stale_allowed };
  }
  async acquire(key: string, owner: string, now: number) {
    // Bound storage growth without deleting active leases or usable stale data.
    // Clean at most 100 old rows per cold lookup, never during fresh hits.
    await query(`DELETE FROM warcraft_logs_cache WHERE cache_key IN (
      SELECT cache_key FROM warcraft_logs_cache
      WHERE updated_at < $1 AND (stale_until IS NULL OR stale_until < $2)
        AND (lease_until IS NULL OR lease_until < $2)
      ORDER BY updated_at LIMIT 100
    )`, [new Date(now - 24 * 60 * 60_000), new Date(now)]);
    const result = await query(`INSERT INTO warcraft_logs_cache(cache_key, lease_owner, lease_until, updated_at)
      VALUES ($1,$2,$3,$4) ON CONFLICT(cache_key) DO UPDATE
      SET lease_owner=$2, lease_until=$3, updated_at=$4
      WHERE (warcraft_logs_cache.lease_until IS NULL OR warcraft_logs_cache.lease_until <= $4)
        AND (warcraft_logs_cache.retry_after IS NULL OR warcraft_logs_cache.retry_after <= $4)
        AND (warcraft_logs_cache.fresh_until IS NULL OR warcraft_logs_cache.fresh_until <= $4)
      RETURNING cache_key`, [key, owner, new Date(now + 45_000), new Date(now)]);
    return result.rowCount === 1;
  }
  async save(key: string, owner: string, summary: LogsSummary, freshUntil: number, staleUntil: number, now: number) {
    const projection = projectLogs(summary);
    await query(`UPDATE warcraft_logs_cache SET projection=$3::jsonb, fresh_until=$4, stale_until=$5,
      retry_after=NULL, stale_allowed=false, lease_owner=NULL, lease_until=NULL, updated_at=$6
      WHERE cache_key=$1 AND lease_owner=$2`, [key, owner, JSON.stringify(projection), new Date(freshUntil), new Date(staleUntil), new Date(now)]);
  }
  async fail(key: string, owner: string, retryAfter: number, staleAllowed: boolean, now: number) {
    await query(`UPDATE warcraft_logs_cache SET retry_after=$3, stale_allowed=$4,
      lease_owner=NULL, lease_until=NULL, updated_at=$5 WHERE cache_key=$1 AND lease_owner=$2`,
    [key, owner, new Date(retryAfter), staleAllowed, new Date(now)]);
  }
}
