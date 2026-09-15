import { notFound } from "next/navigation";
import { VersionShell } from "../../../../components/version-shell";
import { BattleNetImport } from "../../../../components/battle-net-import";
import { BattleNetStart } from "../../../../components/battle-net-start";
import { protectedRouteCallback } from "../../../../lib/auth-callback";
import { requireAuthenticatedUser } from "../../../../lib/auth";
import { battleNetRepository, BattleNetDomainError } from "../../../../lib/battle-net/repository";
import { isContentVersion } from "../../../../lib/game-data";
import type { ContentVersion } from "../../../../lib/types";

export default async function ImportPage({ params, searchParams }: { params: Promise<{ version: string }>; searchParams: Promise<{ session?: string }> }) {
  const { version: raw } = await params; if (!isContentVersion(raw)) notFound(); const version = raw as ContentVersion;
  const user = await requireAuthenticatedUser(protectedRouteCallback(version, "/battle-net/import", await searchParams));
  const sessionId = (await searchParams).session;
  let discovery;
  if (sessionId) { try { discovery = await battleNetRepository.getImportSession(user.id, sessionId); } catch (error) { if (!(error instanceof BattleNetDomainError)) throw error; } }
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-3xl px-5 py-12 lg:px-8 lg:py-16"><div className="eyebrow">Battle.net account discovery</div><h1 className="display mt-3 text-4xl sm:text-5xl">{discovery ? "Battle.net connected" : "Refresh your characters"}</h1>
    {discovery ? <><p className="mt-4 text-sm leading-6 text-[var(--muted)]">We found {discovery.characters.length} character{discovery.characters.length === 1 ? "" : "s"}. Choose once, then PrePull verifies and syncs each supported character.</p>{discovery.discoveryStatus === "era_unavailable" && <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm" role="status">Battle.net connected successfully, but Classic Era account discovery is currently unavailable. TBC/Anniversary account profile data is not substituted with Era data. Manual search remains available.</div>}<BattleNetImport sessionId={discovery.id} version={version} initialCharacters={discovery.characters} /></> : <section className="panel mt-8 rounded-2xl p-6"><p className="text-sm text-[var(--muted)]">This discovery session is missing or expired. Authorize Battle.net again to fetch the latest account list.</p><div className="mt-5 max-w-sm"><BattleNetStart intent="link" callbackUrl={`/${version}/battle-net/import`} compact /></div></section>}
  </main></VersionShell>;
}
