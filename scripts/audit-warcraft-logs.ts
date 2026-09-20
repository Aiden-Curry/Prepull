import { mkdir, writeFile } from "node:fs/promises";
import { loadProjectEnv } from "../lib/config/env.ts";
import { normalizePublicLookup } from "../lib/public-character/path.ts";
import { WCL_SITES, selectLogsSite } from "../lib/warcraft-logs/context.ts";
import { warcraftLogsTransport, WclTransportError } from "../lib/warcraft-logs/transport.ts";
import { auditPublicRankings } from "../lib/warcraft-logs/audit.ts";

loadProjectEnv();
const fresh = process.argv.includes("--fresh");
const input = fresh
  ? { contentVersion: "tbc" as const, realmType: "anniversary" as const, region: "eu" as const, realm: "Spineshatter", characterName: "Carlisha" }
  : { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: "Firemaw", characterName: "Kankan" };
const lookup = normalizePublicLookup(input);
if (!lookup.ok) throw new Error("Invalid audit identity.");
const site = selectLogsSite(input)!;
const identityQuery = `query PrePullIdentityAudit($name: String!, $realm: String!, $region: String!) {
  characterData { character(name: $name, serverSlug: $realm, serverRegion: $region) {
    id canonicalID name level hidden
    server { id name slug region { id name slug compactName } }
  } }
}`;
const metadataQuery = `query PrePullMetadataAudit {
  worldData { zones {
    id name frozen
    partitions { id name compactName default }
    encounters { id name journalID }
  } }
}`;
function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function fields(value: unknown, keys: string[]): Record<string, string | number | boolean | null> {
  const source = object(value);
  return Object.fromEntries(keys.flatMap(key => {
    const field = source?.[key];
    return field === null || ["string", "number", "boolean"].includes(typeof field) ? [[key, field as string | number | boolean | null]] : [];
  }));
}
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
let operationName = "PrePullIdentityAudit";
try {
  const identity = await warcraftLogsTransport.query(site, identityQuery, {
    name: input.characterName, realm: lookup.lookup.realm, region: lookup.lookup.region.toUpperCase(),
  });
  operationName = "PrePullMetadataAudit";
  const metadata = await warcraftLogsTransport.query(site, metadataQuery);
  const characterData = object(identity.data?.characterData);
  const character = object(characterData?.character);
  const server = object(character?.server);
  const world = object(metadata.data?.worldData);
  const errors = [identity, metadata].flatMap(result => result.errors.map(error => ({
    operationName: result.operationName, httpStatus: result.httpStatus, message: error.message, path: error.path,
  })));
  const zones = list(world?.zones).map(value => {
    const zone = object(value);
    return { id: fields(zone, ["id"]).id, name: fields(zone, ["name"]).name, frozen: fields(zone, ["frozen"]).frozen,
      partitions: list(zone?.partitions).map(value => fields(value, ["id", "name", "compactName", "default"])),
      encounters: list(zone?.encounters).map(value => fields(value, ["id", "name", "journalID"])),
    };
  });
  const sanitized = {
    auditedAt: new Date().toISOString(), context: site, endpoint: WCL_SITES[site].graphql,
    requestedIdentity: { region: lookup.lookup.region, realm: lookup.lookup.realm, name: lookup.lookup.characterName },
    character: character ? { ...fields(character, ["id", "canonicalID", "name", "level", "hidden"]),
      server: { ...fields(server, ["id", "name", "slug"]), region: fields(server?.region, ["id", "name", "slug", "compactName"]) } } : null,
    zones, errors,
  };
  await mkdir("test-results/p1c", { recursive: true });
  await writeFile(`test-results/p1c/${site}-metadata-audit.json`, JSON.stringify(sanitized, null, 2) + "\n");
  let rankingAudit = "PENDING_CONTEXT_REVIEW";
  if (process.argv.includes("--rankings") && typeof character?.id === "number" && character.hidden === false && errors.length === 0) {
    operationName = "PrePullRankingAudit";
    const partitionArg = process.argv.find(arg => arg.startsWith("--partition="))?.split("=")[1];
    const rankings = await auditPublicRankings(site, character.id, partitionArg === undefined ? undefined : Number(partitionArg));
    await writeFile(`test-results/p1c/${site}-observed-rankings.json`, JSON.stringify(rankings, null, 2) + "\n");
    rankingAudit = rankings.status;
    errors.push(...rankings.errors);
    if (rankings.status !== "OBSERVED") process.exitCode = 1;
  }
  console.log(JSON.stringify({ tokenAcquisition: "PASS", context: site, graphqlHostname: new URL(WCL_SITES[site].graphql).hostname,
    characterLookup: character ? "PASS" : characterData?.character === null ? "NOT_FOUND" : "FAILED",
    canonicalIdPresent: typeof character?.canonicalID === "number" ? "YES" : "NO",
    metadataZones: zones.length, zones: zones.map(zone => ({ id: zone.id, name: zone.name, encounterCount: zone.encounters.length, partitions: zone.partitions })),
    partialErrors: errors.length, errors, rankingAudit }, null, 2));
  if (!character || errors.length) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ audit: "INCOMPLETE", context: site, operationName: error instanceof WclTransportError ? error.operationName ?? operationName : operationName,
    reason: error instanceof WclTransportError ? error.kind : "local-audit-error",
    httpStatus: error instanceof WclTransportError ? error.httpStatus ?? null : null }));
  process.exitCode = 1;
}
