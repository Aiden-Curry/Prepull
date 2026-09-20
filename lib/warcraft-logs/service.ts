import { randomUUID } from "node:crypto";
import type { LogsCache, LogsCacheEntry } from "./cache.ts";
import { emptyLogs, projectLogs, type LogsSummary, type LogsView } from "./model.ts";
import { WclTransportError } from "./transport.ts";

export const LOGS_TTL = { available: 15 * 60_000, "not-found": 2 * 60_000, hidden: 60_000, "no-public-logs": 5 * 60_000, unsupported: 60_000, "temporary-error": 30_000 };
export class LogsService {
  #inFlight = new Map<string, Promise<LogsView>>();
  #cache: LogsCache;
  #now: () => number;
  #wait: (ms: number) => Promise<void>;
  constructor(cache: LogsCache, options: { now?: () => number; wait?: (ms: number) => Promise<void> } = {}) {
    this.#cache = cache; this.#now = options.now ?? Date.now; this.#wait = options.wait ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  }
  async lookup(key: string, provider: () => Promise<LogsSummary>, authorize: () => Promise<boolean>): Promise<LogsView> {
    const pending = this.#inFlight.get(key); if (pending) return pending;
    const promise = this.#lookup(key, provider, authorize);
    this.#inFlight.set(key, promise);
    try { return await promise; } finally { this.#inFlight.delete(key); }
  }
  #unavailable(): LogsView { return { summary: emptyLogs("temporary-error", new Date(this.#now())), freshness: "unavailable" }; }
  #usable(entry: LogsCacheEntry | undefined): LogsView | undefined {
    if (entry?.summary && entry.freshUntil > this.#now()) return { summary: entry.summary, freshness: "fresh" };
    if (entry?.summary?.status === "available" && entry.staleAllowed && entry.staleUntil > this.#now()) return { summary: entry.summary, freshness: "stale" };
  }
  async #lookup(key: string, provider: () => Promise<LogsSummary>, authorize: () => Promise<boolean>): Promise<LogsView> {
    try {
      let entry = await this.#cache.get(key);
      if (entry?.freshUntil && entry.freshUntil > this.#now() && entry.summary) return { summary: entry.summary, freshness: "fresh" };
      if (entry && entry.retryAfter > this.#now()) return this.#usable(entry) ?? this.#unavailable();
      const owner = randomUUID();
      if (!await this.#cache.acquire(key, owner, this.#now())) {
        // Another instance owns the refresh. Do not launch another request.
        for (const delay of [100, 250, 500]) {
          await this.#wait(delay); entry = await this.#cache.get(key);
          const usable = this.#usable(entry); if (usable) return usable;
          if (entry && entry.retryAfter > this.#now()) break;
        }
        return this.#unavailable();
      }
      try {
        if (!await authorize()) {
          await this.#cache.fail(key, owner, this.#now() + 30_000, false, this.#now());
          return this.#unavailable();
        }
        const summary = projectLogs(await provider(), field => console.warn("[warcraft-logs] invalid_percentile", { field }));
        if (summary.status === "temporary-error") throw new WclTransportError("upstream");
        const now = this.#now();
        // Partial data gets a short retry TTL. Explicit hidden/not-found replaces
        // older visible data and never receives a stale window.
        const partial = summary.reportsUnavailable || summary.raids.some(raid => raid.status === "temporary-error");
        const ttl = partial ? 30_000 : LOGS_TTL[summary.status];
        await this.#cache.save(key, owner, summary, now + ttl, now + (summary.status === "available" ? 60 * 60_000 : ttl), now);
        return { summary, freshness: "fresh" };
      } catch (error) {
        const transient = error instanceof WclTransportError && ["rate-limit", "upstream", "timeout"].includes(error.kind);
        const retry = error instanceof WclTransportError ? error.retryAfterSeconds ?? 30 : 30;
        await this.#cache.fail(key, owner, this.#now() + retry * 1000, transient, this.#now());
        if (transient && entry?.summary?.status === "available" && entry.staleUntil > this.#now()) return { summary: entry.summary, freshness: "stale" };
        return this.#unavailable();
      }
    } catch { return this.#unavailable(); } // Database failures fail closed; no unbounded provider fallback.
  }
}
