import type { EquipmentSlot } from "../types.ts";
import type { CuratedCandidate } from "./types.ts";

const validSlots = new Set<EquipmentSlot>(["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"]);

export type DatasetIssue = { itemId?: number; severity: "error" | "warning"; code: string; message: string };

export function validateCandidateDataset(candidates: CuratedCandidate[], expected?: { contentVersion: string; className: string }): DatasetIssue[] {
  const issues: DatasetIssue[] = [];
  const ids = new Map<number, CuratedCandidate>();
  const sources = new Set<string>();
  for (const candidate of candidates) {
    if (ids.has(candidate.itemId)) issues.push({ itemId: candidate.itemId, severity: "error", code: "duplicate-item-id", message: `Item ID ${candidate.itemId} is duplicated.` });
    ids.set(candidate.itemId, candidate);
    if (!validSlots.has(candidate.slot)) issues.push({ itemId: candidate.itemId, severity: "error", code: "invalid-slot", message: `Invalid slot ${candidate.slot}.` });
    if (!candidate.source) issues.push({ itemId: candidate.itemId, severity: "error", code: "missing-source", message: "Candidate has no acquisition source." });
    if (!candidate.availability || candidate.availability.contentVersion !== "era" || !Number.isInteger(candidate.availability.phase)) issues.push({ itemId: candidate.itemId, severity: "error", code: "invalid-availability", message: "Candidate has invalid Era/phase availability." });
    if (expected && candidate.availability && candidate.availability.contentVersion !== expected.contentVersion) issues.push({ itemId: candidate.itemId, severity: "error", code: "dataset-registration-mismatch", message: "Candidate availability is outside the registered content version." });
    if (expected && candidate.availability.classes && !candidate.availability.classes.some((className) => className.toLowerCase() === expected.className.toLowerCase())) issues.push({ itemId: candidate.itemId, severity: "error", code: "dataset-class-mismatch", message: `Candidate is not available to ${expected.className}.` });
    if (!Object.keys(candidate.stats).length && !candidate.weapon && !candidate.specialEffectId) issues.push({ itemId: candidate.itemId, severity: "warning", code: "missing-stats", message: "Candidate has no stats, weapon properties, or modeled effect." });
    if (candidate.isBestInSlot && !candidate.source) issues.push({ itemId: candidate.itemId, severity: "error", code: "bis-missing-source", message: "Best-in-slot candidate lacks acquisition metadata." });
    if (candidate.sourceQuality === "unverified" || candidate.source?.verification === "unverified") issues.push({ itemId: candidate.itemId, severity: "warning", code: "unverified-source", message: "Acquisition metadata is explicitly unverified." });
    const sourceKey = `${candidate.source?.type}:${candidate.source?.instance ?? ""}:${candidate.source?.boss ?? ""}:${candidate.source?.quest ?? ""}`;
    if (sources.has(sourceKey) && candidate.source?.type !== "World Drop") issues.push({ itemId: candidate.itemId, severity: "warning", code: "duplicate-source-record", message: `Source record ${sourceKey} is repeated; confirm this is intentional.` });
    sources.add(sourceKey);
  }
  return issues;
}

export const validateFuryDataset = (candidates: CuratedCandidate[]) => validateCandidateDataset(candidates);
