import type { CuratedReferenceProfile, ReferenceGearSet, ReferenceProvenance } from "./types.ts";

const provenance: ReferenceProvenance = {
  source: "PrePull Era Frost Mage source review",
  reviewedAt: "2026-09-11",
  reviewedBy: "PrePull data review",
  verificationStatus: "curated",
  notes: "Item identity and acquisition paths were checked against Blizzard Classic item metadata and Warcraft Wiki Classic records. Priority is authored and is not a simulated DPS score.",
};

const shell = (id: string, phase: number, name: string, description: string, datasetVersion: string): ReferenceGearSet => ({
  id,
  contentVersion: "era",
  className: "Mage",
  specialization: "Frost",
  role: "DPS",
  phase,
  name,
  context: "general",
  referenceFrame: phase === 0 ? "progression-era" : "current-era",
  description,
  methodology: "Curated priority based on reviewed Classic Era acquisition paths and item context; it is not a stat-weight simulation or DPS calculation.",
  sourceProvenance: provenance,
  complete: true,
  status: "published",
  publishedAt: "2026-09-11",
  datasetVersion,
  slots: {},
});

const preRaid = shell("era-frost-mage-pre-raid", 0, "Frost Mage Pre-Raid", "Level-60 Frost Mage progression obtainable without raid completion.", "era-frost-mage-pre-raid-v1");
const phaseOne = shell("era-frost-mage-phase-1", 1, "Frost Mage Phase 1", "Phase 1 Frost Mage progression combining the Pre-Raid set with Molten Core and Onyxia's Lair targets.", "era-frost-mage-phase-1-v1");
phaseOne.allowedRaidSources = ["Molten Core", "Onyxia's Lair"];
phaseOne.composition = { setId: phaseOne.id, baseSetId: preRaid.id, additions: [] };

export const eraFrostMageCuratedProfile: CuratedReferenceProfile = {
  id: "era-frost-mage-curated-reference-v1",
  className: "Mage",
  specialization: "Frost",
  contentVersion: "era",
  role: "DPS",
  strategy: "curated-reference",
  contexts: ["general"],
  defaultSetId: preRaid.id,
  methodology: "Curated Classic Era Frost Mage priorities. Rankings are authored for explainable progression and are not simulated DPS scores.",
  sets: [preRaid, phaseOne],
};
