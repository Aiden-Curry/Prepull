import type { EquipmentSlot } from "../types.ts";
import type { CuratedReferenceProfile, ReferenceGearSet, ReferenceProvenance } from "./types.ts";

const provenance: ReferenceProvenance = { source: "PrePull curated Classic Era reference dataset", reviewedAt: "2026-08-12", reviewedBy: "PrePull data review", verificationStatus: "curated", notes: "Structured conclusions only; no numerical DPS claim." };
const phaseSet = (phase: number): ReferenceGearSet => ({ id: `era-fury-phase-${phase}`, contentVersion: "era", className: "Warrior", specialization: "Fury", role: "DPS", phase, name: `Fury Phase ${phase}`, context: "general", referenceFrame: phase === 0 ? "progression-era" : "current-era", description: "Reference-set metadata shell; recommendations are supplied by the canonical generated repository.", methodology: "Curated reference", sourceProvenance: { ...provenance, verificationStatus: "incomplete", notes: "Recommendation rows are maintained in imported normalized data." }, complete: false, status: "incomplete", slots: {} });
const preRaid = phaseSet(0);
preRaid.id = "era-fury-pre-raid";
preRaid.name = "Fury Pre-Raid";
preRaid.description = "Mature Classic Era pre-raid gear obtainable without requiring completion of raid content. This is not a historical launch-Phase-1 snapshot. Recommendations are supplied by imported normalized data.";
preRaid.status = "published";
preRaid.publishedAt = "2026-08-13";
preRaid.datasetVersion = "era-fury-pre-raid-v1";
preRaid.changelog = "Published the first Era Fury Warrior Pre-Raid curated reference set, including phase-aware availability, personalized upgrade recommendations, realistic acquisition paths, faction filtering, paired-slot handling and mature Era non-raid progression.";
export const eraFuryCuratedProfile: CuratedReferenceProfile = { id: "era-fury-curated-reference-v1", className: "Warrior", specialization: "Fury", contentVersion: "era", role: "DPS", strategy: "curated-reference", contexts: ["general"], defaultSetId: preRaid.id, methodology: "CURATED — Mature Classic Era pre-raid recommendations obtainable without requiring raid completion. This is not a historical launch-Phase-1 snapshot and is not simulation-calculated.", sets: [preRaid, phaseSet(1), phaseSet(2), phaseSet(3), phaseSet(4), phaseSet(5), phaseSet(6)] };
export const curatedReferenceProfiles = [eraFuryCuratedProfile];
export const referenceSlots: EquipmentSlot[] = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield", "Ranged / Relic"];
