import type { CharacterRealmType, ContentVersion } from "../types.ts";
export const WCL_HOME = "https://www.warcraftlogs.com";

export const WCL_SITES = {
  vanilla: { site: "https://vanilla.warcraftlogs.com", graphql: "https://vanilla.warcraftlogs.com/api/v2/client" },
  fresh: { site: "https://fresh.warcraftlogs.com", graphql: "https://fresh.warcraftlogs.com/api/v2/client" },
} as const;
export type WarcraftLogsSiteContext = keyof typeof WCL_SITES;
// Site selection is independent of whether its live ranking registry is ready.
export function selectLogsSite(input: { contentVersion: ContentVersion; realmType: CharacterRealmType }): WarcraftLogsSiteContext | undefined {
  if (input.contentVersion === "era" && input.realmType === "era") return "vanilla";
  if (input.contentVersion === "tbc" && input.realmType === "anniversary") return "fresh";
  return undefined;
}
