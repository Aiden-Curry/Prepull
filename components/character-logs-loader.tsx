import { selectLogsSite } from "../lib/warcraft-logs/context";
import { Suspense } from "react";
import { headers } from "next/headers";
import { CharacterLogs, LogsLoading } from "./character-logs";
import { emptyLogs } from "../lib/warcraft-logs/model";
import { logsCacheKey, logsCharacterUrl, logsIdentity, verifiedLogsContext } from "../lib/warcraft-logs/identity";
import { PostgresLogsCache } from "../lib/warcraft-logs/cache";
import { LogsService } from "../lib/warcraft-logs/service";
import { warcraftLogsProvider } from "../lib/warcraft-logs/provider";
import { enforceAbusePolicy } from "../lib/abuse-control/service";
import type { PublicLookupInput } from "../lib/public-character/path";

const service = new LogsService(new PostgresLogsCache());
export function CharacterLogsLoader(props: { input: PublicLookupInput; publicLookupAuthorized?: boolean }) {
  return <Suspense fallback={<LogsLoading />}><LoadLogs {...props} /></Suspense>;
}
async function LoadLogs({ input, publicLookupAuthorized = false }: { input: PublicLookupInput; publicLookupAuthorized?: boolean }) {
  try {
    const identity = logsIdentity(input);
    // Explicit opt-in, dev/test only. Cannot enable fixtures in a production build.
    if (process.env.NODE_ENV !== "production" && process.env.PREPULL_WCL_FIXTURES === "true" && identity.contentVersion === "era" && identity.realmType === "era") {
      const { LOGS_FIXTURE_NAMES, EXISTING_CHARACTER_FIXTURES, logsFixture } = await import("../lib/warcraft-logs/fixtures");
      const scenario = EXISTING_CHARACTER_FIXTURES[`${identity.region}:${identity.realm}:${identity.characterName}`] ?? identity.characterName;
      if (LOGS_FIXTURE_NAMES.some(name => name === scenario)) {
        const context = { site: "vanilla" as const, ecosystem: "era" as const, registryRevision: "synthetic-display-fixtures-v1" };
        const view = await service.lookup(logsCacheKey(input, context), async () => logsFixture(scenario), async () => {
          if (publicLookupAuthorized) return true;
          const request = new Request("https://prepull.internal/character-logs", { headers: new Headers(await headers()) });
          return (await enforceAbusePolicy({ endpoint: "logs_lookup", request })).allowed;
        });
        return <CharacterLogs site="vanilla" view={view} />;
      }
    }
    const context = verifiedLogsContext(input);
    if (!context) return <CharacterLogs site={selectLogsSite(input)} view={{ summary: emptyLogs("unsupported"), freshness: "unavailable" }} />;
    const view = await service.lookup(logsCacheKey(input, context), () => warcraftLogsProvider.lookup(input), async () => {
      if (publicLookupAuthorized) return true;
      const request = new Request("https://prepull.internal/character-logs", { headers: new Headers(await headers()) });
      return (await enforceAbusePolicy({ endpoint: "logs_lookup", request })).allowed;
    });
    return <CharacterLogs site={context.site} characterUrl={logsCharacterUrl(input)} view={view} />;
  } catch { return <CharacterLogs view={{ summary: emptyLogs("temporary-error"), freshness: "unavailable" }} />; }
}
