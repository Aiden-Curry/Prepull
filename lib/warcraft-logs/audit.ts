import { warcraftLogsTransport, type GraphqlResult } from "./transport.ts";
import type { WarcraftLogsSiteContext } from "./context.ts";

export function auditObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
function pick(value: unknown, keys: string[]) {
  const object = auditObject(value);
  return Object.fromEntries(keys.filter(key => object && Object.hasOwn(object, key) && (object[key] === null || ["string", "number", "boolean"].includes(typeof object[key]))).map(key => [key, object![key]]));
}
export function auditErrors(result: GraphqlResult) {
  return result.errors.map(error => ({ operationName: result.operationName, httpStatus: result.httpStatus, message: error.message, path: error.path }));
}
// These keys were observed on the user-selected Vanilla/Fresh characters. This
// is a SANITIZED RESPONSE FIXTURE projection, not the production Logs adapter.
export function captureRankingFields(value: unknown, encounter = false) {
  const raw = auditObject(value);
  if (!raw) return null;
  if (raw.error) return { error: raw.error === "Unsupported zone specified." ? raw.error : "Ranking request failed (details withheld)." };
  const common = pick(raw, ["difficulty", "metric", "partition", "zone", "size"]);
  if (encounter) return { ...common, ...pick(raw, ["bestAmount", "medianPerformance", "averagePerformance", "totalKills", "fastestKill"]),
    ranks: list(raw.ranks).map(rank => pick(rank, ["rankPercent", "historicalPercent", "todayPercent", "rankTotalParses", "historicalTotalParses", "todayTotalParses", "duration", "startTime", "spec", "bestSpec", "amount", "class"])) };
  return { ...common, ...pick(raw, ["bestPerformanceAverage", "medianPerformanceAverage"]),
    allStars: list(raw.allStars).map(star => pick(star, ["spec", "partition"])),
    rankings: list(raw.rankings).map(rank => ({ ...pick(rank, ["rankPercent", "medianPercent", "totalKills", "spec", "bestSpec", "bestAmount"]), encounter: pick(auditObject(rank)?.encounter, ["id", "name"]) })) };
}

export async function auditPublicRankings(site: WarcraftLogsSiteContext, characterId: number, partitionOverride?: number, transport: Pick<typeof warcraftLogsTransport, "query"> = warcraftLogsTransport) {
  const reportsResult = await transport.query(site, `query PrePullReportsAudit($id:Int!) {
    characterData { character(id:$id) { hidden recentReports(limit:5,page:1) { data {code visibility startTime endTime zone {id name} } } } }
  }`, { id: characterId });
  const character = auditObject(auditObject(reportsResult.data?.characterData)?.character);
  if (!character || character.hidden !== false || reportsResult.errors.length) return { status: "BLOCKED", errors: auditErrors(reportsResult) };
  const reports = list(auditObject(character.recentReports)?.data).filter(value => auditObject(value)?.visibility === "public").slice(0, 5).map(value => ({
    ...pick(value, ["code", "visibility", "startTime", "endTime"]), zone: pick(auditObject(value)?.zone, ["id", "name"]),
  }));
  const zoneId = reports[0]?.zone.id;
  if (typeof zoneId !== "number") return { status: "NO_PUBLIC_REPORT_ZONE", errors: [], reports };
  // Current report zone is authoritative. Fresh's generic zones list includes
  // historical IDs; never substitute an old zone merely because its name matches.
  const zoneResult = await transport.query(site, `query PrePullReportedZoneAudit($id:Int!) {
    worldData { zone(id:$id) {id name frozen expansion {id name} partitions {id name compactName default} encounters {id name journalID} } }
  }`, { id: zoneId });
  const zone = auditObject(auditObject(zoneResult.data?.worldData)?.zone);
  const partitions = list(zone?.partitions).map(auditObject);
  const partition = partitionOverride ?? partitions.find(value => value?.default === true)?.id;
  const encounterId = auditObject(list(zone?.encounters)[0])?.id;
  if (!zone || zoneResult.errors.length || typeof partition !== "number" || !partitions.some(value => value?.id === partition) || typeof encounterId !== "number") {
    return { status: "UNVERIFIED_ZONE_OR_PARTITION", errors: auditErrors(zoneResult), reports };
  }
  const rankingResult = await transport.query(site, `query PrePullRankingAudit($id:Int!,$zone:Int!,$partition:Int!,$encounter:Int!) {
    characterData { character(id:$id) {
      zoneDps:zoneRankings(zoneID:$zone,partition:$partition,metric:dps)
      zoneHps:zoneRankings(zoneID:$zone,partition:$partition,metric:hps)
      encounter:encounterRankings(encounterID:$encounter,partition:$partition,metric:dps,includeOtherPlayers:false)
    } }
  }`, { id: characterId, zone: zoneId, partition, encounter: encounterId });
  const ranking = auditObject(auditObject(rankingResult.data?.characterData)?.character);
  const payload = { zoneDps: captureRankingFields(ranking?.zoneDps), zoneHps: captureRankingFields(ranking?.zoneHps), encounter: captureRankingFields(ranking?.encounter, true) };
  const failed = Object.values(payload).some(value => !value || "error" in value) || rankingResult.errors.length > 0;
  return { status: failed ? "RANKING_ERROR" : "OBSERVED", context: site, zone, partition,
    queryFields: { zoneRankings: 2, encounterRankings: 1, recentReportsLimit: 5 },
    ...payload, reports, errors: auditErrors(rankingResult) };
}
