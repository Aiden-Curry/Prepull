import type { CuratedReferenceProfile } from "./types.ts";
import type { ReferenceSetFrame } from "./types.ts";
import { normalizedItemMetadata } from "../item-metadata/store.ts";
import { candidateByName } from "./candidates.ts";
import { availabilityFor, isAvailableInPhase, phaseAwareSources, resolvedPhaseForSet, sourceForPhase } from "./availability.ts";

export type CuratedDataIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  setId: string;
};

const tiers = new Set(["bis", "excellent", "strong", "alternative", "entry"]);
const frames = new Set<ReferenceSetFrame>(["progression-era", "current-era"]);

export function validateReferenceSets(profile: CuratedReferenceProfile): CuratedDataIssue[] {
  const issues: CuratedDataIssue[] = [];
  const known = normalizedItemMetadata();
  const ids = new Set<string>();

  for (const set of profile.sets) {
    if (ids.has(set.id)) issues.push({ severity: "error", code: "duplicate-set-id", message: `Reference set ${set.id} is duplicated.`, setId: set.id });
    ids.add(set.id);
    if (set.contentVersion !== profile.contentVersion || set.className !== profile.className || set.specialization !== profile.specialization || !profile.contexts.includes(set.context)) {
      issues.push({ severity: "error", code: "incompatible-set", message: "Reference set does not match its profile or declared context.", setId: set.id });
    }
    if (set.phase < 0 || set.phase > 6) issues.push({ severity: "error", code: "invalid-phase", message: `Phase ${set.phase} is outside Classic Era phase 0-6.`, setId: set.id });
    if (set.referenceFrame && !frames.has(set.referenceFrame)) issues.push({ severity: "error", code: "invalid-reference-frame", message: `Reference frame ${set.referenceFrame} is invalid.`, setId: set.id });
    if (!set.sourceProvenance.source || !set.sourceProvenance.reviewedAt || !set.sourceProvenance.reviewedBy) issues.push({ severity: "error", code: "missing-provenance", message: "Reference set provenance is incomplete.", setId: set.id });

    const seen = new Set<string>();
    for (const [slot, entries] of Object.entries(set.slots)) {
      for (const reference of entries ?? []) {
        const key = `${slot}:${reference.itemId}:${reference.context ?? set.context}`;
        if (seen.has(key)) issues.push({ severity: "error", code: "duplicate-item-slot-context", message: `Item #${reference.itemId} is duplicated for ${slot}.`, setId: set.id });
        seen.add(key);
        const item = known.get(reference.itemId);
        if (!item) {
          issues.push({ severity: "error", code: "invalid-item-id", message: `Item #${reference.itemId} is not in the curated dataset.`, setId: set.id });
        } else {
          if (item.classRestrictions && !item.classRestrictions.includes(profile.className)) issues.push({ severity: "error", code: "incompatible-class", message: `Item #${reference.itemId} is not available to ${profile.className}.`, setId: set.id });
          if (item.provenance.contentVersion !== profile.contentVersion || reference.phase < 0 || reference.phase > 6) issues.push({ severity: "error", code: "invalid-item-phase", message: `Item #${reference.itemId} has invalid reference phase ${reference.phase}.`, setId: set.id });
          if (reference.setId && reference.setId !== set.id && reference.setId !== item.setId) issues.push({ severity: "error", code: "set-membership-mismatch", message: `Item #${reference.itemId} declares set ${reference.setId}, which does not match reference set ${set.id}.`, setId: set.id });
        }
        if (!tiers.has(reference.tier)) issues.push({ severity: "error", code: "invalid-tier", message: `Item #${reference.itemId} has an invalid recommendation tier.`, setId: set.id });
        if (reference.context && reference.context !== set.context) issues.push({ severity: "error", code: "context-mismatch", message: `Item #${reference.itemId} context does not match the reference set.`, setId: set.id });
        if (!reference.source?.type) issues.push({ severity: "error", code: "missing-source", message: `Item #${reference.itemId} has no acquisition source.`, setId: set.id });
        const availabilityPhase = resolvedPhaseForSet(set.phase);
        const availability = availabilityFor(reference.itemId);
        if (!availability) issues.push({ severity: "error", code: "missing-availability", message: `Item #${reference.itemId} has no explicit phase-availability record; known canonical rows cannot default to Phase 1.`, setId: set.id });
        else if (availability.availableUntilPhase !== undefined && availability.availableFromPhase > availability.availableUntilPhase) issues.push({ severity: "error", code: "invalid-availability-range", message: `Item #${reference.itemId} has an invalid availability phase range.`, setId: set.id });
        else if (!isAvailableInPhase(reference.itemId, availabilityPhase)) issues.push({ severity: "error", code: "unavailable-in-reference-phase", message: `Item #${reference.itemId} is not available in Phase ${availabilityPhase}.`, setId: set.id });
        const phaseSource = sourceForPhase(reference.itemId, availabilityPhase);
        if (phaseSource && (phaseSource.type !== reference.source.type || phaseSource.boss !== reference.source.boss)) issues.push({ severity: "error", code: "source-outside-phase", message: `Item #${reference.itemId} uses an acquisition source that is not valid for Phase ${availabilityPhase}.`, setId: set.id });
        const sourceRecords = phaseAwareSources.get(reference.itemId) ?? [];
        for (let index = 0; index < sourceRecords.length; index += 1) for (let other = index + 1; other < sourceRecords.length; other += 1) { const left = sourceRecords[index]; const right = sourceRecords[other]; const leftEnd = left.phaseUntil ?? 6; const rightEnd = right.phaseUntil ?? 6; if (left.phaseFrom <= rightEnd && right.phaseFrom <= leftEnd) issues.push({ severity: "error", code: "overlapping-source-phases", message: `Item #${reference.itemId} has overlapping acquisition source phase windows.`, setId: set.id }); }
        const raidOrigin = reference.itemId === 16984 || candidateByName("Black Dragonscale Boots")?.itemId === reference.itemId;
        if (set.id === "era-fury-pre-raid" && (reference.requiresRaidContent || reference.source.type === "Raid" || raidOrigin)) issues.push({ severity: "error", code: "raid-dependent-pre-raid-item", message: `Item #${reference.itemId} requires raid-origin materials and cannot be in the mature Era Pre-Raid set.`, setId: set.id });
        if (!reference.provenance?.source || !reference.provenance.reviewedAt || !reference.provenance.reviewedBy) issues.push({ severity: "error", code: "missing-item-provenance", message: `Item #${reference.itemId} has incomplete provenance.`, setId: set.id });
      }
    }
    if (!set.complete) issues.push({ severity: "warning", code: "incomplete-set", message: "Reference set is intentionally incomplete; missing rankings are not inferred.", setId: set.id });
  }
  return issues;
}
