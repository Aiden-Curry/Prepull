import test from "node:test";
import assert from "node:assert/strict";
import { logsFixture } from "../lib/warcraft-logs/fixtures.ts";
import { emptyLogs, progression, projectLogs, type LogsSummary } from "../lib/warcraft-logs/model.ts";
import { logsCacheKey, logsCharacterUrl, logsReportUrl, verifiedLogsContext, isLogsCharacterUrl } from "../lib/warcraft-logs/identity.ts";
import { LogsService, LOGS_TTL } from "../lib/warcraft-logs/service.ts";
import type { LogsCache, LogsCacheEntry } from "../lib/warcraft-logs/cache.ts";
import { WclTransportError } from "../lib/warcraft-logs/transport.ts";
import { selectLogsSite, WCL_SITES } from "../lib/warcraft-logs/context.ts";
import { readFileSync } from "node:fs";
import { auditPublicRankings, captureRankingFields } from "../lib/warcraft-logs/audit.ts";

const identity = { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: "Firemaw", characterName: "Aidy" };
const context = { site: "vanilla" as const, ecosystem: "era" as const, registryRevision: "test-partition-1" };
test("Logs identity uses canonical normalization and all context dimensions", () => {
  const key = logsCacheKey(identity, context);
  assert.equal(key, logsCacheKey({ ...identity, realm: "firemaw", characterName: "aidy" }, context));
  for (const other of [{ ...identity, region: "us" as const }, { ...identity, realm: "whitemane" }, { ...identity, characterName: "Another" }, { ...identity, contentVersion: "tbc" as const }, { ...identity, realmType: "anniversary" as const }]) assert.notEqual(key, logsCacheKey(other, context));
  assert.notEqual(key, logsCacheKey(identity, { ...context, registryRevision: "test-partition-2" }));
  assert.notEqual(key, logsCacheKey(identity, { ...context, ecosystem: "anniversary-tbc" }));
  assert.notEqual(key, logsCacheKey(identity, { ...context, site: "fresh" }));
  assert.equal(verifiedLogsContext(identity)?.site, "vanilla");
  assert.equal(verifiedLogsContext({ ...identity, contentVersion: "tbc", realmType: "anniversary" }), undefined);
  assert.equal(logsCharacterUrl(identity), "https://vanilla.warcraftlogs.com/character/eu/firemaw/aidy");
  assert.equal(logsReportUrl("vanilla", "https://evil.test"), undefined);
  assert.equal(logsReportUrl("vanilla", "AbCdEfGh12345678"), "https://vanilla.warcraftlogs.com/reports/AbCdEfGh12345678");
});
test("WCL site selection requires both content version and realm ecosystem", () => {
  assert.equal(selectLogsSite(identity), "vanilla");
  assert.equal(selectLogsSite({ contentVersion: "tbc", realmType: "anniversary" }), "fresh");
  assert.equal(selectLogsSite({ contentVersion: "tbc", realmType: "era" }), undefined);
  assert.equal(selectLogsSite({ contentVersion: "era", realmType: "anniversary" }), undefined);
  assert.equal(logsCharacterUrl({ ...identity, contentVersion: "tbc", realmType: "anniversary", realm: "Spineshatter", characterName: "Carlisha" }), `${WCL_SITES.fresh.site}/character/eu/spineshatter/carlisha`);
  assert.equal(logsCharacterUrl({ ...identity, contentVersion: "tbc" }), undefined);
  assert.equal(logsReportUrl("fresh", "AbCdEfGh12345678"), `${WCL_SITES.fresh.site}/reports/AbCdEfGh12345678`);
  assert.equal(isLogsCharacterUrl("vanilla", logsCharacterUrl(identity)!), true);
  assert.equal(isLogsCharacterUrl("fresh", logsCharacterUrl(identity)!), false);
  assert.equal(isLogsCharacterUrl("fresh", "https://fresh.warcraftlogs.com.evil.test/character/eu/spineshatter/carlisha"), false);
  assert.equal(isLogsCharacterUrl("fresh", "https://fresh.warcraftlogs.com/character/eu/spineshatter/carlisha?secret=bad"), false);
});
test("Observed live fixtures preserve Vanilla multi-spec and Fresh healer fields without raw account data", () => {
  const vanilla = JSON.parse(readFileSync(new URL("./fixtures/warcraft-logs/vanilla-observed-rankings.json", import.meta.url), "utf8"));
  const fresh = JSON.parse(readFileSync(new URL("./fixtures/warcraft-logs/fresh-observed-rankings.json", import.meta.url), "utf8"));
  assert.equal(vanilla.zone.id, 2006); assert.equal(vanilla.partition, 1);
  assert.ok(vanilla.encounter.ranks.some((rank: { spec: string }) => rank.spec === "Protection"));
  assert.ok(vanilla.encounter.ranks.some((rank: { spec: string }) => rank.spec === "Fury"));
  assert.equal(fresh.zone.id, 1048); assert.equal(fresh.partition, 3);
  assert.ok(fresh.zoneHps.rankings.some((rank: { spec: string; totalKills: number }) => rank.spec === "Holy" && rank.totalKills > 0));
  for (const response of [vanilla.zoneDps, fresh.zoneHps]) {
    assert.deepEqual(captureRankingFields({ ...response, token: "private", owner: { id: "private" }, report: { code: "private" } }), response);
  }
  assert.doesNotMatch(JSON.stringify([vanilla, fresh]), /access_token|client_secret|Authorization|ownerId/);
});
test("Ranking audit follows public report zone, excludes unlisted/private reports, and validates returned partitions", async () => {
  const calls: { site: string; variables: Record<string, unknown> }[] = [];
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/warcraft-logs/fresh-observed-rankings.json", import.meta.url), "utf8"));
  const transport = { async query(site: "vanilla" | "fresh", query: string, variables: Record<string, unknown> = {}) {
    calls.push({ site, variables });
    const data = query.includes("PrePullReportsAudit") ? { characterData: { character: { hidden: false, recentReports: { data: [
      { code: "private-report", visibility: "private", zone: { id: 1007 } },
      { code: "unlisted-report", visibility: "unlisted", zone: { id: 1007 } },
      ...fixture.reports,
    ] } } } } : query.includes("PrePullReportedZoneAudit") ? { worldData: { zone: fixture.zone } } : { characterData: { character: { zoneDps: fixture.zoneDps, zoneHps: fixture.zoneHps, encounter: fixture.encounter } } };
    return { data, errors: [], operationName: "FixtureAudit", httpStatus: 200 };
  } };
  const result = await auditPublicRankings("fresh", 1, 3, transport);
  assert.equal(result.status, "OBSERVED"); assert.equal(calls.length, 3);
  assert.equal(calls[1].variables.id, 1048); assert.equal(calls[2].variables.partition, 3);
  assert.ok(calls.every(call => call.site === "fresh")); assert.doesNotMatch(JSON.stringify(result), /private-report|unlisted-report/);
  calls.length = 0;
  assert.equal((await auditPublicRankings("fresh", 1, 999, transport)).status, "UNVERIFIED_ZONE_OR_PARTITION");
  assert.equal(calls.length, 2);
});

for (const killed of [0, 1, 9, 10]) test(`Logs progression ${killed}/10 counts unique verified kills only`, () => {
  const raid = logsFixture("logsfull").raids[0];
  raid.bosses.forEach((boss, index) => { boss.performances[0].kills = index < killed ? 7 : 0; });
  raid.bosses.push({ ...raid.bosses[0], encounterId: 999999, progression: false, performances: [] });
  assert.deepEqual(progression(raid), { killed, total: 10, cleared: killed === 10 });
  raid.bosses.push(raid.bosses[0]);
  assert.deepEqual(progression(raid), { killed, total: 10, cleared: killed === 10 });
});
test("A percentile alone does not prove a kill; missing percentile does not erase a kill", () => {
  const raid = logsFixture("logsfull").raids[0];
  delete raid.bosses[0].performances[0].kills;
  delete raid.bosses[1].performances[0].best;
  assert.equal(progression(raid).killed, 9);
  raid.status = "temporary-error"; assert.equal(progression(raid).cleared, false);
});
test("Projection preserves separate metrics/specs and exact supplied aggregates without inventing absent values", () => {
  const multi = projectLogs(logsFixture("logsmulti"));
  assert.deepEqual(multi.raids[0].bosses[9].performances.map(p => p.spec), ["Fury", "Protection"]);
  assert.equal(projectLogs(logsFixture("logshealer")).raids[0].bosses[0].performances[0].metric, "HPS");
  assert.deepEqual(multi.raids[0].aggregates.map(a => [a.label, a.value]), [["Best Performance Avg", 92.4], ["Median Performance Avg", 79.2]]);
  multi.raids[0].aggregates = []; assert.deepEqual(projectLogs(multi).raids[0].aggregates, []);
});
test("Projection rejects corrupt bounds, duplicate registry entries and unsafe report links", () => {
  const value = logsFixture("logsfull"), invalid: string[] = [];
  value.raids[0].bosses[0].performances[0].best = 101;
  value.raids[0].aggregates[0].value = -1;
  const projected = projectLogs(value, field => invalid.push(field));
  assert.equal(projected.raids[0].bosses[0].performances[0].best, undefined);
  assert.equal(projected.raids[0].aggregates.length, 1); assert.deepEqual(invalid, ["best", "aggregate"]);
  const duplicate = logsFixture("logsfull"); duplicate.raids.push(duplicate.raids[0]); assert.throws(() => projectLogs(duplicate));
  const duplicateBoss = logsFixture("logsfull"); duplicateBoss.raids[0].bosses.push(duplicateBoss.raids[0].bosses[0]); assert.throws(() => projectLogs(duplicateBoss));
  value.reports[0].code = "javascript:bad"; assert.throws(() => projectLogs(value));
});
test("Projection strips extras and all performance data from visibility/negative states", () => {
  const fixture = logsFixture("logsfull");
  const clean = projectLogs({ ...fixture, access_token: "private-token", secret: "private-secret", userId: "private-user" });
  assert.doesNotMatch(JSON.stringify(clean), /private/);
  for (const status of ["hidden", "not-found", "no-public-logs", "unsupported", "temporary-error"] as const) {
    const result = projectLogs({ ...fixture, status }); assert.equal(result.status, status); assert.deepEqual(result.raids, []); assert.deepEqual(result.reports, []);
  }
});

class MemoryCache implements LogsCache {
  entries = new Map<string, LogsCacheEntry>();
  owners = new Map<string, string>();
  async get(key: string) { return this.entries.get(key); }
  async acquire(key: string, owner: string, now: number) {
    if (this.owners.has(key) || (this.entries.get(key)?.retryAfter ?? 0) > now || (this.entries.get(key)?.freshUntil ?? 0) > now) return false;
    this.owners.set(key, owner); return true;
  }
  async save(key: string, owner: string, summary: LogsSummary, freshUntil: number, staleUntil: number) {
    if (this.owners.get(key) !== owner) return;
    this.entries.set(key, { summary: projectLogs(summary), freshUntil, staleUntil, retryAfter: 0, staleAllowed: false }); this.owners.delete(key);
  }
  async fail(key: string, owner: string, retryAfter: number, staleAllowed: boolean) {
    if (this.owners.get(key) !== owner) return;
    this.entries.set(key, { ...this.entries.get(key), freshUntil: this.entries.get(key)?.freshUntil ?? 0, staleUntil: this.entries.get(key)?.staleUntil ?? 0, retryAfter, staleAllowed }); this.owners.delete(key);
  }
}
test("Cold/fresh/expired cache requests deduplicate and charge only provider work", async () => {
  const cache = new MemoryCache(); let now = 1, calls = 0, quotas = 0;
  const service = new LogsService(cache, { now: () => now });
  const provider = async () => { calls++; return logsFixture("logsfull"); };
  const authorize = async () => { quotas++; return true; };
  const results = await Promise.all(Array.from({ length: 20 }, () => service.lookup("key", provider, authorize)));
  assert.equal(results.length, 20); assert.equal(calls, 1); assert.equal(quotas, 1);
  const second = new LogsService(cache, { now: () => now });
  await second.lookup("key", provider, authorize); assert.equal(calls, 1);
  now += LOGS_TTL.available + 1; await second.lookup("key", provider, authorize); assert.equal(calls, 2);
});
for (const kind of ["upstream", "rate-limit", "timeout", "authentication", "invalid-response"] as const) test(`Stale policy for ${kind}`, async () => {
  const cache = new MemoryCache(); let now = 1;
  const service = new LogsService(cache, { now: () => now });
  await service.lookup("key", async () => logsFixture("logsfull"), async () => true);
  now += LOGS_TTL.available + 1;
  const result = await service.lookup("key", async () => { throw new WclTransportError(kind); }, async () => true);
  const stale = ["upstream", "rate-limit", "timeout"].includes(kind);
  assert.equal(result.freshness, stale ? "stale" : "unavailable");
  await service.lookup("key", async () => { assert.fail("Retry cooldown must suppress provider"); }, async () => true);
  now = 3_600_002;
  const expired = await service.lookup("key", async () => { throw new WclTransportError(kind); }, async () => true);
  assert.equal(expired.freshness, "unavailable");
});
for (const status of ["hidden", "not-found", "no-public-logs"] as const) test(`${status} replaces public data with a short negative TTL`, async () => {
  const cache = new MemoryCache(); let now = 1;
  const service = new LogsService(cache, { now: () => now });
  await service.lookup("key", async () => logsFixture("logsfull"), async () => true);
  now += LOGS_TTL.available + 1;
  const result = await service.lookup("key", async () => emptyLogs(status), async () => true);
  assert.equal(result.summary.status, status); assert.deepEqual(result.summary.raids, []);
  assert.equal(cache.entries.get("key")?.freshUntil, now + LOGS_TTL[status]);
  assert.equal(cache.entries.get("key")?.staleUntil, now + LOGS_TTL[status]);
});
test("Partial raid results preserve successful sections and retry soon", async () => {
  const cache = new MemoryCache(); const service = new LogsService(cache, { now: () => 1 });
  const result = await service.lookup("key", async () => logsFixture("logszoneerror"), async () => true);
  assert.equal(result.summary.raids[0].status, "available"); assert.equal(result.summary.raids[1].status, "temporary-error");
  assert.equal(cache.entries.get("key")?.freshUntil, 30_001);
});
test("Database failure or denied authorization never starts upstream work", async () => {
  const cache = new MemoryCache(), service = new LogsService(cache);
  const denied = await service.lookup("denied", async () => { assert.fail("Denied"); }, async () => false);
  assert.equal(denied.summary.status, "temporary-error");
  cache.get = async () => { throw new Error("database internals"); };
  const failed = await service.lookup("failed", async () => { assert.fail("Database down"); }, async () => true);
  assert.equal(failed.summary.status, "temporary-error"); assert.doesNotMatch(JSON.stringify(failed), /internals/);
});
