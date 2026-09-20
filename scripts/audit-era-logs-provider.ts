import { loadProjectEnv } from "../lib/config/env.ts";
import { WclTransport } from "../lib/warcraft-logs/transport.ts";
import { WarcraftLogsProvider } from "../lib/warcraft-logs/provider.ts";
import { ERA_RAIDS } from "../lib/warcraft-logs/registry.ts";
import { logsCacheKey, verifiedLogsContext } from "../lib/warcraft-logs/identity.ts";
import { LogsService } from "../lib/warcraft-logs/service.ts";
import { PostgresLogsCache } from "../lib/warcraft-logs/cache.ts";
import { query, closePool } from "../lib/guilds/db.ts";
import { writeFile, mkdir } from "node:fs/promises";

// This audit writes only the independent WCL cache in explicitly local PostgreSQL.
if (!process.env.DATABASE_URL || !["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error("Explicit local audit database required");
loadProjectEnv();
let graphqlCalls = 0, tokenCalls = 0, partialErrors = 0;
const transport = new WclTransport({ credentials: () => ({ clientId: process.env.WARCRAFT_LOGS_CLIENT_ID!, clientSecret: process.env.WARCRAFT_LOGS_CLIENT_SECRET! }), fetch: async (input, init) => {
  const url = new URL(String(input)); if (url.pathname === "/oauth/token") tokenCalls++; else graphqlCalls++;
  return fetch(input, init);
} });
const input = { contentVersion: "era", realmType: "era", region: "eu", realm: "firemaw", characterName: "kankan" } as const;
try {
  const metadata = await transport.query("vanilla", `query PrePullEraSmokeMetadata {
    worldData { zones { id name encounters { id name } partitions { id name default } } }
    characterData { character(name:"Kankan",serverSlug:"firemaw",serverRegion:"EU") { canonicalID hidden } }
    rateLimitData { pointsSpentThisHour }
  }`);
  const world = metadata.data?.worldData as { zones?: {id:number}[] } | undefined;
  const character = (metadata.data?.characterData as {character?:{canonicalID?:number}} | undefined)?.character;
  const encounter = await transport.query("vanilla", `query PrePullEraSmokeEncounter {
    characterData { character(name:"Kankan",serverSlug:"firemaw",serverRegion:"EU") { encounterRankings(encounterID:50663,partition:1,metric:dps,includeOtherPlayers:false) } }
  }`);
  const encounterData = (encounter.data?.characterData as {character?:{encounterRankings?:{totalKills?:number;partition?:number;zone?:number}}} | undefined)?.character?.encounterRankings;
  const calibration = await transport.query("vanilla", "query PrePullCostCalibration { rateLimitData { pointsSpentThisHour } }");
  const beforeCost = await transport.query("vanilla", "query PrePullCostBefore { rateLimitData { pointsSpentThisHour } }");
  const provider = new WarcraftLogsProvider({ query: async (...args) => { const result = await transport.query(...args); partialErrors += result.errors.length; return result; } });
  const key = logsCacheKey(input, verifiedLogsContext(input)!);
  await query("DELETE FROM warcraft_logs_cache WHERE cache_key=$1", [key]);
  const before = graphqlCalls;
  const first = await new LogsService(new PostgresLogsCache()).lookup(key, () => provider.lookup(input), async () => true);
  const providerCalls = graphqlCalls - before;
  const secondBefore = graphqlCalls;
  const second = await new LogsService(new PostgresLogsCache()).lookup(key, () => provider.lookup(input), async () => true);
  const secondCalls = graphqlCalls - secondBefore;
  const afterCost = await transport.query("vanilla", "query PrePullCostAfter { rateLimitData { pointsSpentThisHour } }");
  const points = (r: typeof beforeCost) => (r.data?.rateLimitData as {pointsSpentThisHour?:number}|undefined)?.pointsSpentThisHour;
  const report = {
    token: tokenCalls === 1 ? "PASS" : "FAIL", context: "vanilla", character: character?.canonicalID ? "PASS" : "FAIL", canonicalId: Boolean(character?.canonicalID),
    worldData: metadata.errors.length === 0 ? "PASS" : "FAIL", standardEraZones: world?.zones?.filter(z => ERA_RAIDS.some(r => r.id === z.id)).length,
    zoneRankings: first.summary.status === "available" ? "PASS" : "FAIL", encounterRankings: encounter.errors.length === 0 && encounterData?.partition === 1 && encounterData.zone === 2000 && (encounterData.totalKills ?? 0) > 0 ? "PASS" : "FAIL",
    recentReports: first.summary.reports.length > 0 && !first.summary.reportsUnavailable ? "PASS" : "FAIL",
    raidsWithPublicData: first.summary.raids.filter(r => r.bosses.some(b => b.performances.length)).length,
    providerGraphqlHttpCalls: providerCalls, providerColdHttpCallsIncludingToken: providerCalls + tokenCalls,
    providerCostWindowPoints: points(afterCost)! - points(beforeCost)!, costWindowIncludesFinalMeasurementQuery: true,
    measurementQueryPoints: points(beforeCost)! - points(calibration)!,
    providerMeasuredPoints: Math.round((points(afterCost)! - points(beforeCost)! - (points(beforeCost)! - points(calibration)!)) * 10000) / 10000,
    totalAuditGraphqlHttpCalls: graphqlCalls, partialErrors: partialErrors + metadata.errors.length + encounter.errors.length,
    cacheSecondLookupWclCalls: secondCalls, cacheSecondFreshness: second.freshness,
  };
  await mkdir("test-results/p1c", { recursive: true });
  await writeFile("test-results/p1c/provider-live-smoke.json", JSON.stringify(report, null, 2) + "\n");
  await writeFile("test-results/p1c/live-summary.json", JSON.stringify(first.summary, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (first.summary.status !== "available" || secondCalls !== 0 || second.freshness !== "fresh") process.exitCode = 1;
} finally { await closePool(); }
