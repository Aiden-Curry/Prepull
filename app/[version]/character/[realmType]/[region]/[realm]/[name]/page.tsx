import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterOverview } from "../../../../../../../components/character-view";
import { VersionShell } from "../../../../../../../components/version-shell";
import { isContentVersion } from "../../../../../../../lib/game-data";
import { CharacterProviderError } from "../../../../../../../lib/providers/character-provider";
import { getCharacterProvider } from "../../../../../../../lib/providers/factory";
import { summarizeUpgrades } from "../../../../../../../lib/upgrades/mock-upgrades";
import { analyzeCharacter } from "../../../../../../../lib/gear-analysis/engine";
import { AnalysisStatus } from "../../../../../../../components/analysis-ui";
import { CharacterRealmType, ContentVersion, Region } from "../../../../../../../lib/types";
import { evaluateCuratedReference } from "../../../../../../../lib/curated-gear/evaluate";
import { CuratedOverview } from "../../../../../../../components/curated-ui";

function ProviderState({ version, title, message, realmType }: { version: ContentVersion; title: string; message: string; realmType: CharacterRealmType }) {
  return <VersionShell version={version}><main className="grid min-h-[calc(100vh-148px)] place-items-center px-5 text-center"><div><div className="eyebrow mb-4">Character lookup / {realmType.toUpperCase()}</div><h1 className="display text-4xl">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">{message}</p><div className="mt-7 flex justify-center gap-3"><Link href={`/${version}`} className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-bold text-[var(--background)]">Back to search</Link><Link href={`/${version}/character/era/eu/firemaw/aidy`} className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-bold text-[var(--text)]">Use sample character</Link></div></div></main></VersionShell>;
}

export default async function CharacterPage({ params }: { params: { version: string; realmType: string; region: string; realm: string; name: string } }) {
  if (!isContentVersion(params.version) || !["era", "anniversary"].includes(params.realmType) || !["eu", "us"].includes(params.region)) notFound();
  const version = params.version as ContentVersion;
  const realmType = params.realmType as CharacterRealmType;
  try {
    const character = await getCharacterProvider().findCharacter({ contentVersion: version, realmType, region: params.region as Region, realm: params.realm, characterName: params.name });
    if (!character) return <ProviderState version={version} realmType={realmType} title="Character not found." message={`We could not find that ${realmType} character. Check the realm, region, and spelling, then try again.`} />;
    const analysis = analyzeCharacter(character);
    const recommendations = analysis.supported ? analysis.recommendations : [];
    const curated = character.contentVersion === "era" && character.class === "Warrior" && character.spec === "Fury" ? evaluateCuratedReference(character) : undefined;
    return <VersionShell version={version}><CharacterOverview character={character} recommendations={recommendations} summary={summarizeUpgrades(recommendations)} />{curated && <CuratedOverview evaluation={curated} />}<AnalysisStatus analysis={analysis} /></VersionShell>;
  } catch (error) {
    if (error instanceof CharacterProviderError) {
      if (error.code === "CharacterNotFound" || error.code === "RealmNotFound") return <ProviderState version={version} realmType={realmType} title="Character not found." message="Blizzard did not return a matching character profile." />;
      if (error.code === "UnsupportedRealmType" || error.code === "UnsupportedGameVersion") return <ProviderState version={version} realmType={realmType} title="Live data unavailable for this realm type." message="Blizzard’s currently verified profile API does not expose this realm ecosystem yet. PrePull has not substituted another ecosystem." />;
      return <ProviderState version={version} realmType={realmType} title="Provider unavailable." message={error.message} />;
    }
    console.error("[character-page] unexpected provider failure", { version, realmType, region: params.region });
    return <ProviderState version={version} realmType={realmType} title="Provider unavailable." message="The character provider returned an unexpected error. Please try again." />;
  }
}
