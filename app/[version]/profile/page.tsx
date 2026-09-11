import { notFound } from "next/navigation";
import { VersionShell } from "../../../components/version-shell";
import { requireAuthenticatedUser } from "../../../lib/auth";
import { savedCharacterRepository } from "../../../lib/characters/saved-repository";
import { characterSyncRepository } from "../../../lib/characters/sync-repository";
import { refreshCharacterAction } from "../../../lib/characters/sync-actions";
import { isContentVersion } from "../../../lib/game-data";
import { disableReadinessShareAction, enableReadinessShareAction } from "../../../lib/guilds/readiness-actions";
import { listEligibleReadinessShares } from "../../../lib/guilds/readiness-service";
import type { ContentVersion } from "../../../lib/types";

export default async function ProfilePage({ params }: { params: Promise<{ version: string }> }) {
  const { version: raw } = await params;
  if (!isContentVersion(raw)) notFound();
  const version = raw as ContentVersion;
  const user = await requireAuthenticatedUser();
  const [characters, shares] = await Promise.all([savedCharacterRepository.listSavedCharacters(user.id), listEligibleReadinessShares(user.id)]);
  const primary = characters.find((character) => character.isPrimary);
  const [sync, history] = primary ? await Promise.all([characterSyncRepository.getLatestSuccessful(primary.id), characterSyncRepository.getHistory(primary.id, 5)]) : [undefined, []];
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-[900px] px-5 py-12 lg:px-8 lg:py-16">
    <div className="eyebrow">Account</div><h1 className="display mt-3 text-5xl">Your PrePull profile.</h1>
    <section className="panel mt-10 rounded-2xl p-6"><dl className="grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[var(--muted)]">Name</dt><dd className="mt-1 font-semibold">{user.displayName}</dd></div><div><dt className="text-xs text-[var(--muted)]">Saved characters</dt><dd className="mt-1 font-semibold">{characters.length}</dd></div></dl></section>
    <section aria-labelledby="readiness-sharing-heading" className="panel mt-5 rounded-2xl p-6">
      <div className="eyebrow">Guild privacy</div><h2 id="readiness-sharing-heading" className="display mt-2 text-3xl">Readiness sharing</h2>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">Sharing is optional. Guild officers and assigned raid leaders can see recommendation support, your latest successful refresh time, evaluated slots, and high-level opportunity counts. They cannot see your email, equipment history, other characters, or Session Planner.</p>
      {shares.length ? <div className="mt-5 grid gap-3">{shares.map((share) => <article className="rounded-xl border border-[var(--line)] p-4" key={`${share.guildId}:${share.guildCharacterId}:${share.userCharacterId}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{share.characterName}</h3><p className="mt-1 text-xs text-[var(--muted)]">{share.guildName} · {share.enabled ? "Readiness shared" : "Not sharing"}</p></div>{share.enabled && share.shareId ? <form action={disableReadinessShareAction}><input type="hidden" name="version" value={version}/><input type="hidden" name="guildId" value={share.guildId}/><input type="hidden" name="shareId" value={share.shareId}/><button className="button-secondary" type="submit">Stop sharing</button></form> : <form action={enableReadinessShareAction}><input type="hidden" name="version" value={version}/><input type="hidden" name="guildId" value={share.guildId}/><input type="hidden" name="guildCharacterId" value={share.guildCharacterId}/><input type="hidden" name="userCharacterId" value={share.userCharacterId}/><button className="button-primary" type="submit">Share readiness</button></form>}</div></article>)}</div> : <p className="mt-5 text-sm text-[var(--muted)]">No saved character currently matches an active, approved guild character claim.</p>}
    </section>
    {primary && <><section className="panel mt-5 rounded-2xl p-6"><div className="eyebrow">Primary character</div><h2 className="display mt-2 text-3xl">{primary.characterName}</h2><p className="mt-2 text-sm text-[var(--muted)]">{primary.className} · {primary.realmName} · {primary.characterRealmType}</p><p className="mt-3 text-sm text-[var(--muted)]">{sync ? `Last refreshed ${new Date(sync.syncedAt).toLocaleString()}.` : "Never refreshed. Current equipment is not yet stored."}</p><form action={refreshCharacterAction}><input type="hidden" name="characterId" value={primary.id}/><button className="button-primary mt-5" type="submit">Refresh character</button></form></section>{sync && <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><article className="panel rounded-2xl p-6"><div className="eyebrow">Current equipment</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{sync.equipment.map((item) => <div className="rounded-lg border border-[var(--line)] p-3" key={item.slot}><p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{item.slot}</p><p className="mt-1 text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">Item {item.itemId || "empty"}</p></div>)}</div></article><article className="panel rounded-2xl p-6"><div className="eyebrow">Recent updates</div><div className="mt-4 space-y-3">{history.map((entry, index) => <div className="border-l-2 border-[var(--line)] pl-3" key={entry.id}><p className="text-sm font-semibold">{entry.status === "success" ? `${entry.equipment.length || 0} gear slots recorded` : "Refresh failed"}</p><p className="mt-1 text-xs text-[var(--muted)]">{new Date(entry.syncedAt).toLocaleString()}</p>{index === history.length - 1 && <p className="mt-1 text-xs text-[var(--muted)]">Baseline</p>}</div>)}</div></article></section>}</>}
  </main></VersionShell>;
}
