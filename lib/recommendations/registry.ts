import type { ContentVersion, NormalizedCharacter } from "../types.ts";
import type { CuratedCandidate } from "../gear-analysis/types.ts";
import { CuratedReferenceRepository, type ReferenceEntryDecorator } from "../curated-gear/repository.ts";
import type { CuratedReferenceProfile } from "../curated-gear/types.ts";
import type { SpecAuthoringManifest, SpecRuleModule } from "./manifest.ts";
import { recommendationSpecManifests } from "./manifests/index.ts";

export type SupportedSpecKey = typeof recommendationSpecManifests[number]["key"];
export type SpecRecommendationConfig = {
  key: SupportedSpecKey;
  contentVersion: ContentVersion;
  className: string;
  specName: string;
  availablePhases: readonly number[];
  setIdByPhase: Readonly<Record<number, string>>;
  profile: CuratedReferenceProfile;
  candidates: CuratedCandidate[];
  decorateEntry?: ReferenceEntryDecorator;
  ruleModule?: SpecRuleModule;
  includeSingleBestInSlotTargets?: boolean;
  manifest: SpecAuthoringManifest;
};

export const recommendationRegistry: readonly SpecRecommendationConfig[] = recommendationSpecManifests.map((manifest) => ({
  key: manifest.key,
  contentVersion: manifest.contentVersion,
  className: manifest.className,
  specName: manifest.specName,
  availablePhases: manifest.phases.map((phase) => phase.phase),
  setIdByPhase: Object.fromEntries(manifest.phases.map((phase) => [phase.phase, phase.setId])),
  profile: manifest.profile,
  candidates: manifest.candidates,
  decorateEntry: manifest.decorateEntry,
  ruleModule: manifest.ruleModule,
  includeSingleBestInSlotTargets: manifest.includeSingleBestInSlotTargets,
  manifest,
}));

const identity = (value: string) => value.trim().toLowerCase();
export function getCharacterRecommendationSupport(character: Pick<NormalizedCharacter, "contentVersion" | "class" | "spec">) {
  const config = recommendationRegistry.find((entry) => entry.contentVersion === character.contentVersion && identity(entry.className) === identity(character.class) && identity(entry.specName) === identity(character.spec));
  return config ? { supported: true as const, specKey: config.key, phases: [...config.availablePhases], config } : { supported: false as const, reason: character.contentVersion === "era" ? "specialization-not-supported" as const : "content-version-not-supported" as const };
}

export function loadRecommendationProfile(config: SpecRecommendationConfig) { return new CuratedReferenceRepository(config.profile, config.decorateEntry).getProfile(); }

export function getRecommendationConfigForProfile(profile: Pick<CuratedReferenceProfile, "id" | "contentVersion" | "className" | "specialization">) {
  return recommendationRegistry.find((entry) => entry.profile.id === profile.id || (entry.contentVersion === profile.contentVersion && identity(entry.className) === identity(profile.className) && identity(entry.specName) === identity(profile.specialization)));
}

export function findRegisteredRecommendationCandidate(contentVersion: ContentVersion, className: string, specName: string, itemId: number) {
  return recommendationRegistry.find((entry) => entry.contentVersion === contentVersion && identity(entry.className) === identity(className) && identity(entry.specName) === identity(specName))?.candidates.find((candidate) => candidate.itemId === itemId);
}

export function validateRecommendationRegistry(entries: readonly SpecRecommendationConfig[] = recommendationRegistry): string[] {
  const issues: string[] = []; const combinations = new Set<string>(); const keys = new Set<string>();
  for (const entry of entries) {
    const combination = `${entry.contentVersion}:${identity(entry.className)}:${identity(entry.specName)}`;
    if (combinations.has(combination)) issues.push(`Duplicate recommendation registration for ${combination}.`); combinations.add(combination);
    if (keys.has(entry.key)) issues.push(`Duplicate recommendation key ${entry.key}.`); keys.add(entry.key);
    if (entry.profile.contentVersion !== entry.contentVersion) issues.push(`${entry.key} profile content version does not match its registration.`);
    if (identity(entry.profile.className) !== identity(entry.className) || identity(entry.profile.specialization) !== identity(entry.specName)) issues.push(`${entry.key} profile identity does not match its registration.`);
    let resolvedProfile: CuratedReferenceProfile | undefined;
    try { resolvedProfile = loadRecommendationProfile(entry); } catch (error) { issues.push(`${entry.key} could not load its curated dataset: ${error instanceof Error ? error.message : String(error)}`); }
    for (const phase of entry.availablePhases) {
      const setId = entry.setIdByPhase[phase];
      const set = resolvedProfile?.sets.find((candidate) => candidate.id === setId);
      if (!setId || !set) issues.push(`${entry.key} is missing its Phase ${phase} dataset registration.`);
      else {
        if (set.contentVersion !== entry.contentVersion || identity(set.className) !== identity(entry.className) || identity(set.specialization) !== identity(entry.specName) || set.phase !== phase) issues.push(`${entry.key} Phase ${phase} dataset metadata does not match its registration.`);
        if (!Object.values(set.slots).some((slot) => (slot?.length ?? 0) > 0)) issues.push(`${entry.key} Phase ${phase} dataset has no curated rows.`);
      }
    }
    for (const phase of Object.keys(entry.setIdByPhase).map(Number)) if (!entry.availablePhases.includes(phase)) issues.push(`${entry.key} registers unavailable Phase ${phase}.`);
    if (!entry.candidates.length) issues.push(`${entry.key} has no item dataset.`);
    for (const candidate of entry.candidates) if (candidate.availability.contentVersion !== entry.contentVersion || (candidate.availability.classes && !candidate.availability.classes.some((className) => identity(className) === identity(entry.className)))) issues.push(`${entry.key} candidate #${candidate.itemId} does not match the registered content/class.`);
    for (const issue of entry.ruleModule?.validate(entry.candidates) ?? []) issues.push(`${entry.key} rule ${entry.ruleModule?.id}: ${issue}`);
  }
  return issues;
}
