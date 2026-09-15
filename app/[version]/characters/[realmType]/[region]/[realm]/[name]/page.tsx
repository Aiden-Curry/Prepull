import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { VersionShell } from "../../../../../../../components/version-shell";
import { enforceAbusePolicy } from "../../../../../../../lib/abuse-control/service";
import { authOptions } from "../../../../../../../lib/auth";
import { authSignInHref, authSignUpHref } from "../../../../../../../lib/auth-callback";
import { normalizeLookup } from "../../../../../../../lib/characters/normalization";
import { saveCharacterAction } from "../../../../../../../lib/characters/saved-actions";
import { savedCharacterRepository } from "../../../../../../../lib/characters/saved-repository";
import { isContentVersion } from "../../../../../../../lib/game-data";
import { lookupPublicCharacter } from "../../../../../../../lib/public-character/lookup";
import { normalizePublicLookup, publicCharacterPath } from "../../../../../../../lib/public-character/path";
import type { PublicCharacterProjection } from "../../../../../../../lib/public-character/types";
import type { CharacterRealmType, ContentVersion, Region } from "../../../../../../../lib/types";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata { return { title: "Public character · PrePull", robots: { index: false, follow: false } }; }

type Params = { version: string; realmType: string; region: string; realm: string; name: string };

export default async function PublicCharacterPage({ params }: { params: Promise<Params> }) {
  const raw = await params;
  if (!isContentVersion(raw.version) || !["era", "anniversary"].includes(raw.realmType) || !["eu", "us"].includes(raw.region)) notFound();
  const input = { contentVersion: raw.version as ContentVersion, realmType: raw.realmType as CharacterRealmType, region: raw.region as Region, realm: raw.realm, characterName: raw.name };
  const normalized = normalizePublicLookup(input); if (!normalized.ok) notFound();
  const canonical = publicCharacterPath(input)!;
  if (raw.realm !== normalized.lookup.realm || raw.name !== normalized.lookup.characterName) redirect(canonical);
  const requestHeaders = new Headers(await headers());
  const limited = await enforceAbusePolicy({ endpoint: "public_lookup", request: new Request(`https://prepull.internal${canonical}`, { headers: requestHeaders }) });
  if (!limited.allowed) return <PublicState version={input.contentVersion} title="Too many searches." message="Try again shortly before searching for another character." />;
  const result = await lookupPublicCharacter(input);
  if (result.status === "not_found") return <PublicState version={input.contentVersion} title="We couldn't find that character." message="Check the region, realm, and spelling, then try again." />;
  if (result.status === "temporary_error") return <PublicState version={input.contentVersion} title="Battle.net is temporarily unavailable." message="Try again shortly. Temporary provider failures are not treated as missing characters." />;
  if (result.status === "unsupported") return <PublicState version={input.contentVersion} title="Live lookup isn't available for this realm ecosystem." message="PrePull has not substituted Era data for this Anniversary character." />;
  if (result.status === "invalid") notFound();
  const character = result.character; const session = await getServerSession(authOptions);
  const saved = session?.user?.id && character.realmType === "era" ? await savedCharacterRepository.findSavedCharacterByIdentity(session.user.id, { region: character.region, realmSlug: character.realm, normalizedCharacterName: character.name, characterRealmType: character.realmType }) : undefined;
  return <VersionShell version={input.contentVersion}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-[900px] px-5 py-12 lg:px-8 lg:py-16">
    <Link href={`/${input.contentVersion}#character-search`} className="focus-ring text-xs text-[var(--text-muted)]">← Find another character</Link>
    <section className="panel mt-8 rounded-3xl p-6 sm:p-9" aria-labelledby="public-character-heading"><div className="eyebrow">Public character · {character.providerStatus === "live" ? "Battle.net" : "Preview provider"}</div><h1 id="public-character-heading" className="display mt-3 text-5xl">{character.name}</h1><p className="mt-3 text-lg text-[var(--text)]">Level {character.level} {character.race} {character.className}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{character.realm} · {character.region.toUpperCase()} · {character.contentVersion === "era" ? "Classic Era" : "The Burning Crusade"}</p>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Fact label="Specialization" value={character.specialization} /><Fact label="Faction" value={character.faction} /><Fact label="Realm ecosystem" value={character.realmType === "anniversary" ? "Anniversary" : "Era"} /><Fact label="Data status" value={character.providerStatus === "live" ? "Live public profile" : "Deterministic preview"} /></dl>
      <p className="mt-7 text-sm leading-6 text-[var(--text-muted)]">Current public character information. Save this character to establish trusted sync history and get personalized recommendations.</p>
      <CharacterCta version={input.contentVersion} canonical={canonical} character={character} signedIn={Boolean(session?.user?.id)} saved={Boolean(saved)} />
    </section>
  </main></VersionShell>;
}

function CharacterCta({ version, canonical, character, signedIn, saved }: { version: ContentVersion; canonical: string; character: PublicCharacterProjection; signedIn: boolean; saved: boolean }) {
  if (character.realmType !== "era") return <div className="mt-7 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100" role="status">TBC Anniversary · Live PrePull syncing is not currently available for this realm ecosystem.</div>;
  if (saved) return <div className="mt-7"><Link className="button-primary focus-ring" href={`/${version}/dashboard`}>Open my character</Link></div>;
  if (!signedIn) return <div className="mt-7"><h2 className="display text-2xl">Save this character</h2><div className="mt-4 flex flex-wrap gap-3"><Link className="button-primary focus-ring" href={authSignUpHref(canonical)}>Create account</Link><Link className="button-secondary focus-ring" href={authSignInHref(canonical)}>Sign in</Link></div></div>;
  return <form action={saveCharacterAction} className="mt-7"><input type="hidden" name="contentVersion" value={character.contentVersion} /><input type="hidden" name="realmType" value={character.realmType} /><input type="hidden" name="region" value={character.region} /><input type="hidden" name="realm" value={character.realm} /><input type="hidden" name="characterName" value={character.name} /><button className="button-primary focus-ring" type="submit">Add to my characters</button></form>;
}

function PublicState({ version, title, message }: { version: ContentVersion; title: string; message: string }) { return <VersionShell version={version}><main className="grid min-h-[calc(100vh-148px)] place-items-center px-5 text-center"><div role="status"><div className="eyebrow">Public character lookup</div><h1 className="display mt-3 text-4xl">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-muted)]">{message}</p><Link href={`/${version}#character-search`} className="button-secondary focus-ring mt-7">Back to character search</Link></div></main></VersionShell>; }
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--border)] p-4"><dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</dt><dd className="mt-2 font-semibold">{value}</dd></div>; }
