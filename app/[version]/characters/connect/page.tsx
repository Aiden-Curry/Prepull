import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterFinderForm } from "../../../../components/character-finder-form";
import { VersionShell } from "../../../../components/version-shell";
import { requireAuthenticatedUser } from "../../../../lib/auth";
import { protectedRouteCallback } from "../../../../lib/auth-callback";
import { safeFinderError, validateFinderQuery } from "../../../../lib/characters/finder";
import { saveCharacterAction } from "../../../../lib/characters/saved-actions";
import { isContentVersion } from "../../../../lib/game-data";
import { getCharacterProvider } from "../../../../lib/providers/factory";
import type { CharacterRealmType, ContentVersion, NormalizedCharacter, Region } from "../../../../lib/types";

const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default async function ConnectCharacterPage({ params, searchParams }: { params: Promise<{ version: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { version: rawVersion } = await params;
  if (!isContentVersion(rawVersion)) notFound();
  const version = rawVersion as ContentVersion; const query = await searchParams;
  await requireAuthenticatedUser(protectedRouteCallback(version, "/characters/connect", query));
  const initial = { region: (["eu", "us"].includes(one(query.region)) ? one(query.region) : "eu") as Region, realmType: (["era", "anniversary"].includes(one(query.realmType)) ? one(query.realmType) : "era") as CharacterRealmType, realm: one(query.realm), name: one(query.name) };
  let character: NormalizedCharacter | null = null; let message = "";
  if (query.search === "1") {
    const validated = validateFinderQuery(version, query);
    if (!validated.ok) message = validated.message;
    else try { character = await getCharacterProvider().findCharacter(validated.lookup); if (!character) message = "We couldn't find that character. Check the spelling, realm, and region."; } catch (error) { message = safeFinderError(error); }
  }
  const supported = character?.realmType === "era";
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-[980px] px-5 py-12 lg:px-8 lg:py-16">
    <Link href={`/${version}/dashboard`} className="text-xs text-[var(--muted)] hover:text-[var(--primary-light)]">← Back to dashboard</Link>
    <div className="mt-10 max-w-2xl"><div className="eyebrow mb-3">Characters / Find</div><h1 className="display text-5xl tracking-[-.04em]">Find your WoW character.</h1><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Enter the exact region, realm, and character name. Content version and realm ecosystem remain independent.</p></div>
    <CharacterFinderForm version={version} initial={initial} />
    {message && <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]" role="status">{message}<div className="mt-3"><Link className="text-[var(--primary-light)]" href={`/${version}/characters/connect`}>Search again →</Link></div></div>}
    {character && <section className="panel mt-6 rounded-2xl p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow">Character found</div><h2 className="display mt-2 text-3xl">{character.name}</h2><p className="mt-1 text-sm text-[var(--muted)]">Level {character.level} {character.race} {character.class}</p><p className="mt-1 text-sm text-[var(--muted)]">{character.realm} · {character.region.toUpperCase()} · {character.realmType === "anniversary" ? "Anniversary" : "Era"}</p></div><span className="rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--primary-light)]">{character.dataMeta?.isLive ? "Live profile" : "Test profile"}</span></div><dl className="mt-7 grid gap-4 text-sm sm:grid-cols-4"><Fact label="Class" value={character.class} /><Fact label="Level" value={String(character.level)} /><Fact label="Race" value={character.race} /><Fact label="Faction" value={character.faction} /></dl>{supported ? <div className="mt-7 flex flex-wrap gap-3"><form action={saveCharacterAction}><input type="hidden" name="contentVersion" value={version} /><input type="hidden" name="realmType" value={character.realmType} /><input type="hidden" name="region" value={character.region} /><input type="hidden" name="realm" value={character.realm} /><input type="hidden" name="characterName" value={character.name} /><button className="button-primary" type="submit">Add to my characters</button></form><Link href={`/${version}/characters/connect`} className="button-secondary">Search again</Link></div> : <div className="mt-7 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100" role="status">This profile is on an Anniversary realm. PrePull cannot sync or recommend for Anniversary characters yet; Era profiles are currently supported.</div>}</section>}
  </main></VersionShell>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
