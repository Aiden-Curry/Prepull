import { createHash } from "node:crypto";
import { normalizePublicLookup, type PublicLookupInput } from "../public-character/path.ts";
import { WCL_SITES, selectLogsSite, type WarcraftLogsSiteContext } from "./context.ts";
import { ERA_REGISTRY_REVISION } from "./registry.ts";

export type LogsContext = { site: WarcraftLogsSiteContext; ecosystem: "era" | "anniversary-tbc"; registryRevision: string };
export const WCL_REGIONS = { eu: "eu", us: "us" } as const;
export function logsIdentity(input: PublicLookupInput) {
  const result = normalizePublicLookup(input);
  if (!result.ok) throw new Error("Invalid Warcraft Logs identity");
  return result.lookup;
}
export function logsCacheKey(input: PublicLookupInput, context: LogsContext) {
  const identity = logsIdentity(input);
  const parts = [context.site, context.ecosystem, context.registryRevision, identity.contentVersion, identity.realmType,
    WCL_REGIONS[identity.region], identity.realm, identity.characterName];
  return "wcl:v1:" + createHash("sha256").update(parts.join("\0")).digest("hex");
}
export function verifiedLogsContext(input: PublicLookupInput): LogsContext | undefined {
  return selectLogsSite(input) === "vanilla" ? { site: "vanilla", ecosystem: "era", registryRevision: ERA_REGISTRY_REVISION } : undefined;
}
export function logsCharacterUrl(input: PublicLookupInput) {
  const identity = logsIdentity(input);
  const site = selectLogsSite(identity);
  return site ? `${WCL_SITES[site].site}/character/${WCL_REGIONS[identity.region]}/${encodeURIComponent(identity.realm)}/${encodeURIComponent(identity.characterName)}` : undefined;
}
export function logsReportUrl(site: WarcraftLogsSiteContext, code: string) {
  return /^[a-zA-Z0-9]{16}$/.test(code) ? `${WCL_SITES[site].site}/reports/${code}` : undefined;
}
export function isLogsCharacterUrl(site: WarcraftLogsSiteContext, value: string) {
  try {
    const url = new URL(value);
    return url.origin === WCL_SITES[site].site && !url.username && !url.password && !url.search && !url.hash &&
      /^\/character\/(eu|us)\/[a-z0-9-]+\/[^/]+$/.test(url.pathname);
  } catch { return false; }
}
