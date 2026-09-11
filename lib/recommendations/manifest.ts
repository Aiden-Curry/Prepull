import type { CuratedReferenceProfile, ReferenceItemEntry, ReferenceProvenance } from "../curated-gear/types.ts";
import type { CuratedCandidate } from "../gear-analysis/types.ts";
import type { ContentVersion, EquipmentSlot, EquippedItem, NormalizedCharacter } from "../types.ts";
import type { ReferenceEntryDecorator } from "../curated-gear/repository.ts";

export type SpecPhaseManifest = {
  phase: number;
  label: string;
  setId: string;
  datasetVersion: string;
  authoringFile: string;
  snapshotFile: string;
  acceptedSnapshotSha256?: string;
};

export type SpecCapabilities = {
  playerAdvice: boolean;
  progressTracking: boolean;
  sessionPlanner: boolean;
};

export type SpecRuleModule = {
  id: string;
  validate(candidates: readonly CuratedCandidate[]): string[];
  compareOptions?(input: { character: NormalizedCharacter; slot: EquipmentSlot; left: SpecRuleItem; right: SpecRuleItem }): number;
  conditionalNotes?(input: { character: NormalizedCharacter; item: SpecRuleItem; reference: ReferenceItemEntry; options: readonly SpecRuleItem[] }): string[];
};
export type SpecRuleItem = EquippedItem & { reference: ReferenceItemEntry; isRealistic?: boolean; weaponRole?: CuratedCandidate["weaponRole"] };

export function parseSpecManifest(value: unknown): { manifest?: SpecAuthoringManifest; issues: string[] } {
  const issues: string[] = [];
  if (!value || typeof value !== "object") return { issues: ["Manifest must be an object."] };
  const candidate = value as Partial<SpecAuthoringManifest>;
  for (const field of ["key", "contentVersion", "className", "specName", "documentationPath"] as const) if (typeof candidate[field] !== "string" || !candidate[field]?.trim()) issues.push(`Manifest ${field} is required.`);
  if (!Number.isInteger(candidate.level) || Number(candidate.level) <= 0) issues.push("Manifest level must be a positive integer.");
  if (!Array.isArray(candidate.phases) || !candidate.phases.length) issues.push("Manifest requires at least one phase.");
  else {
    const phases = new Set<number>(); const setIds = new Set<string>(); const versions = new Set<string>();
    for (const phase of candidate.phases) {
      if (!Number.isInteger(phase.phase) || phase.phase < 0) issues.push("Manifest phase numbers must be non-negative integers.");
      if (phases.has(phase.phase)) issues.push(`Manifest duplicates Phase ${phase.phase}.`); phases.add(phase.phase);
      if (!phase.setId || setIds.has(phase.setId)) issues.push(`Manifest set ID ${phase.setId || "<missing>"} is missing or duplicated.`); setIds.add(phase.setId);
      if (!phase.datasetVersion || versions.has(phase.datasetVersion)) issues.push(`Manifest dataset version ${phase.datasetVersion || "<missing>"} is missing or duplicated.`); versions.add(phase.datasetVersion);
      if (!phase.authoringFile || !phase.snapshotFile) issues.push(`Manifest Phase ${phase.phase} requires authoring and snapshot paths.`);
    }
  }
  if (!candidate.profile || !Array.isArray(candidate.candidates) || !candidate.capabilities || !candidate.provenance) issues.push("Manifest runtime data, capabilities, and provenance are required.");
  return issues.length ? { issues } : { manifest: candidate as SpecAuthoringManifest, issues };
}

export type SpecManifestSeed = {
  key: string;
  contentVersion: ContentVersion;
  className: string;
  specName: string;
  level: number;
  role: string;
  phases: readonly SpecPhaseManifest[];
  methodology: string;
  provenance: ReferenceProvenance & { id: string; sourceUrl?: string };
  documentationPath: string;
  capabilities: SpecCapabilities;
};

export type SpecAuthoringManifest = SpecManifestSeed & {
  profile: CuratedReferenceProfile;
  candidates: CuratedCandidate[];
  decorateEntry?: ReferenceEntryDecorator;
  ruleModule?: SpecRuleModule;
  includeSingleBestInSlotTargets?: boolean;
  strictCandidateMetadata?: boolean;
};

export function createCuratedProfile(seed: SpecManifestSeed): CuratedReferenceProfile {
  const sets = seed.phases.map((phase) => ({
    id: phase.setId,
    contentVersion: seed.contentVersion,
    className: seed.className,
    specialization: seed.specName,
    role: seed.role,
    phase: phase.phase,
    name: `${seed.specName} ${seed.className} ${phase.label}`,
    context: "general" as const,
    referenceFrame: phase.phase === 0 ? "progression-era" as const : "current-era" as const,
    description: phase.phase === 0
      ? `Level-${seed.level} ${seed.specName} ${seed.className} progression obtainable without raid completion.`
      : `Phase ${phase.phase} ${seed.specName} ${seed.className} progression composed with reviewed raid targets.`,
    methodology: seed.methodology,
    sourceProvenance: seed.provenance,
    complete: true,
    status: "published" as const,
    datasetVersion: phase.datasetVersion,
    ...(phase.phase > 0 ? {
      allowedRaidSources: ["Molten Core", "Onyxia's Lair"],
      composition: { setId: phase.setId, baseSetId: seed.phases[0].setId, additions: [] },
    } : {}),
    slots: {},
  }));
  return {
    id: `${seed.key}-curated-reference-v1`,
    className: seed.className,
    specialization: seed.specName,
    contentVersion: seed.contentVersion,
    role: seed.role,
    strategy: "curated-reference",
    contexts: ["general"],
    defaultSetId: seed.phases[0].setId,
    methodology: seed.methodology,
    sets,
  };
}
