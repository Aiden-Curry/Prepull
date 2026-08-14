import { notFound } from "next/navigation";
import { GearDetail } from "../../../../../../../../../components/character-view";
import { VersionShell } from "../../../../../../../../../components/version-shell";
import { isContentVersion } from "../../../../../../../../../lib/game-data";
import { analyzeCharacter } from "../../../../../../../../../lib/gear-analysis/engine";
import { getCharacterProvider } from "../../../../../../../../../lib/providers/factory";
import { CharacterRealmType, ContentVersion, Region } from "../../../../../../../../../lib/types";
import { AnalysisSlotPanel } from "../../../../../../../../../components/analysis-ui";
import { evaluateCuratedReference } from "../../../../../../../../../lib/curated-gear/evaluate";
import { CuratedSlotPanel } from "../../../../../../../../../components/curated-ui";

export default async function GearSlotPage({ params }: { params: Promise<{ version: string; realmType: string; region: string; realm: string; name: string; slot: string }> }) {
  const resolvedParams = await params;
  if (!isContentVersion(resolvedParams.version) || !["era", "anniversary"].includes(resolvedParams.realmType) || !["eu", "us"].includes(resolvedParams.region)) notFound();
  const version = resolvedParams.version as ContentVersion;
  const character = await getCharacterProvider().findCharacter({ contentVersion: version, realmType: resolvedParams.realmType as CharacterRealmType, region: resolvedParams.region as Region, realm: resolvedParams.realm, characterName: resolvedParams.name });
  if (!character) notFound();
  const slot = resolvedParams.slot.replaceAll("-", " ");
  const analysis = analyzeCharacter(character);
  const recommendation = analysis.supported ? analysis.bySlot[slot]?.bestRealistic ?? analysis.bySlot[slot]?.bestInSlot : undefined;
  const curated = character.contentVersion === "era" && character.class === "Warrior" && character.spec === "Fury" ? evaluateCuratedReference(character) : undefined;
  return <VersionShell version={version}><GearDetail character={character} recommendation={recommendation} /><main className="mx-auto max-w-[1000px] px-5 pb-16 lg:px-8"><AnalysisSlotPanel analysis={analysis} slot={slot} />{curated && <CuratedSlotPanel evaluation={curated} slot={slot} />}</main></VersionShell>;
}
